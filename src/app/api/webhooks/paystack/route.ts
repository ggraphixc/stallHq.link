import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhookSignature, verifyTransaction, getSubscriptionExpiry } from "@/lib/paystack";
import { sendUpgradeThankYou } from "@/lib/email";
import { SubscriptionPlan } from "@/types";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!signature) {
      console.error("Paystack webhook: No signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("Paystack webhook: Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the event
    const event = JSON.parse(rawBody);
    const { event: eventType, data } = event;

    console.log(`Paystack webhook: ${eventType}`, data?.reference);

    // Only process successful charge events
    if (eventType !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const { reference, status, amount } = data;

    // Verify the transaction with Paystack directly
    const verification = await verifyTransaction(reference);

    if (!verification.status || verification.data.status !== "success") {
      console.error(`Paystack webhook: Transaction ${reference} not successful`);
      return NextResponse.json({ received: true });
    }

    // Look up the payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("paystack_reference", reference)
      .single();

    if (paymentError || !payment) {
      console.error(`Paystack webhook: Payment not found for reference ${reference}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Idempotency: skip if already processed
    if (payment.paystack_status === "success") {
      console.log(`Paystack webhook: Payment ${reference} already processed`);
      return NextResponse.json({ received: true });
    }

    // Verify amount matches
    if (payment.amount !== amount) {
      console.error(`Paystack webhook: Amount mismatch for ${reference}. Expected ${payment.amount}, got ${amount}`);
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    const plan = payment.plan as SubscriptionPlan;

    // Calculate new subscription expiry
    const newExpiry = getSubscriptionExpiry(plan);

    // Update payment status
    await supabaseAdmin
      .from("payments")
      .update({
        paystack_status: "success",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    // Update the store's plan and subscription details
    const { error: storeError } = await supabaseAdmin
      .from("stores")
      .update({
        plan,
        subscription_expires_at: newExpiry.toISOString(),
        verified: plan === "annual", // Only premium gets verified badge
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.store_id);

    if (storeError) {
      console.error(`Paystack webhook: Error updating store plan:`, storeError);
      return NextResponse.json({ error: "Failed to update store" }, { status: 500 });
    }

    console.log(`Paystack webhook: Successfully activated ${plan} for store ${payment.store_id}`);

    // Send upgrade thank you email (non-blocking)
    try {
      const { data: storeData } = await supabaseAdmin
        .from("stores")
        .select("name")
        .eq("id", payment.store_id)
        .single();

      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(payment.user_id);

      if (userData?.user?.email) {
        sendUpgradeThankYou({
          email: userData.user.email,
          name: userData.user.user_metadata?.name || userData.user.user_metadata?.full_name,
          storeName: storeData?.name || "Your Store",
          plan,
        }).catch(() => {});
      }
    } catch {
      // Non-blocking — email failure should not fail the webhook
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
