import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/alerts/stock — Subscribe to a back-in-stock alert.
 * Body: { product_id, device_id }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, device_id } = body;

    if (!product_id || !device_id) {
      return NextResponse.json({ error: "product_id and device_id required" }, { status: 400 });
    }

    // Check for existing alert
    const { data: existing } = await supabaseAdmin
      .from("stock_alerts")
      .select("id")
      .eq("product_id", product_id)
      .eq("device_id", device_id)
      .eq("notified", false)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, already_subscribed: true });
    }

    const { error } = await supabaseAdmin.from("stock_alerts").insert({
      product_id,
      device_id,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[stock-alert] POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/alerts/stock — Remove a stock alert.
 * Query: ?product_id=xxx&device_id=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");
    const deviceId = searchParams.get("device_id");

    if (!productId || !deviceId) {
      return NextResponse.json({ error: "product_id and device_id required" }, { status: 400 });
    }

    await supabaseAdmin
      .from("stock_alerts")
      .delete()
      .eq("product_id", productId)
      .eq("device_id", deviceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[stock-alert] DELETE error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * GET /api/alerts/stock — Check if user has a stock alert for a product.
 * Query: ?product_id=xxx&device_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");
    const deviceId = searchParams.get("device_id");

    if (!productId || !deviceId) {
      return NextResponse.json({ alert: null });
    }

    const { data: alert } = await supabaseAdmin
      .from("stock_alerts")
      .select("id, notified")
      .eq("product_id", productId)
      .eq("device_id", deviceId)
      .eq("notified", false)
      .single();

    return NextResponse.json({ alert: alert || null });
  } catch (error) {
    return NextResponse.json({ alert: null });
  }
}
