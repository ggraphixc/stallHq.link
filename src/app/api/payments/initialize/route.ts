import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { initializeTransaction, generateReference, getPlanAmountKobo } from "@/lib/paystack";
import { PLANS } from "@/lib/subscription";
import { SubscriptionPlan } from "@/types";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body as { plan: SubscriptionPlan };

    // Validate plan
    if (!plan || !PLANS[plan] || plan === "trial") {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Check plan has a price
    if (PLANS[plan].price <= 0) {
      return NextResponse.json(
        { error: "This plan does not require payment" },
        { status: 400 }
      );
    }

    // Get user's store
    const { data: store } = await authSupabase
      .from("stores")
      .select("id, name, slug")
      .eq("user_id", user.id)
      .single();

    if (!store) {
      return NextResponse.json(
        { error: "No store found. Create a store first." },
        { status: 404 }
      );
    }

    // Generate reference
    const reference = generateReference();

    // Calculate amount in kobo
    const amount = getPlanAmountKobo(plan);

    // Create pending payment record
    const { error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        store_id: store.id,
        user_id: user.id,
        plan,
        amount,
        paystack_reference: reference,
        paystack_status: "pending",
        metadata: {
          store_name: store.name,
          store_slug: store.slug,
          plan_name: PLANS[plan].name,
        },
      });

    if (insertError) {
      console.error("Error creating payment record:", insertError);
      return NextResponse.json(
        { error: "Failed to create payment record" },
        { status: 500 }
      );
    }

    // Initialize Paystack transaction
    const result = await initializeTransaction({
      email: user.email!,
      amount,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&ref=${reference}`,
      metadata: {
        store_id: store.id,
        user_id: user.id,
        plan,
        reference,
      },
    });

    if (!result.status) {
      return NextResponse.json(
        { error: result.message || "Failed to initialize payment" },
        { status: 500 }
      );
    }

    // Update payment record with access code
    await supabaseAdmin
      .from("payments")
      .update({ paystack_access_code: result.data.access_code })
      .eq("paystack_reference", reference);

    return NextResponse.json({
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference,
    });
  } catch (error) {
    console.error("Error initializing payment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment initialization failed" },
      { status: 500 }
    );
  }
}
