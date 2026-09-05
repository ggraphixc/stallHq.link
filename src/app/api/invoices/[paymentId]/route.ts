import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/api";
import { generateInvoicePDF, type InvoiceData } from "@/lib/invoice";
import type { SubscriptionPlan } from "@/types";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/invoices/[paymentId] — Serve a PDF invoice for a completed payment.
 * The requesting user must own the store that made the payment.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const supabase = await createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the payment with store info
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("*, stores!inner(id, user_id, name, slug)")
      .eq("id", paymentId)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify ownership
    if (payment.stores?.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only generate invoices for successful payments
    if (payment.paystack_status !== "success") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const plan = payment.plan as SubscriptionPlan;
    const now = new Date();
    const periodEnd = new Date(now);

    // Calculate period based on plan
    switch (plan) {
      case "monthly":
        periodEnd.setDate(now.getDate() + 30);
        break;
      case "quarterly":
        periodEnd.setDate(now.getDate() + 90);
        break;
      case "annual":
        periodEnd.setDate(now.getDate() + 365);
        break;
    }

    // Get user email
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(payment.user_id);

    const invoiceData: InvoiceData = {
      invoiceNumber: `INV-${payment.id.slice(0, 8).toUpperCase()}`,
      paymentReference: payment.paystack_reference,
      storeName: payment.stores?.name || "Store",
      storeEmail: userData?.user?.email || "",
      plan,
      amount: payment.amount,
      currency: payment.currency || "NGN",
      paidAt: payment.updated_at || payment.created_at,
      periodStart: payment.created_at,
      periodEnd: periodEnd.toISOString(),
    };

    const pdfBytes = await generateInvoicePDF(invoiceData);

    return new NextResponse(pdfBytes.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoiceData.invoiceNumber}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
