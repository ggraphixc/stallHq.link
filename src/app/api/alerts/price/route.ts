import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendPushToUsers, saveInAppNotifications } from "@/lib/push";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/alerts/price — Subscribe to a price drop alert.
 * Body: { product_id, device_id, target_price }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, device_id, target_price } = body;

    if (!product_id || !device_id || target_price == null) {
      return NextResponse.json({ error: "product_id, device_id, target_price required" }, { status: 400 });
    }

    // Check for existing alert
    const { data: existing } = await supabaseAdmin
      .from("price_alerts")
      .select("id")
      .eq("product_id", product_id)
      .eq("device_id", device_id)
      .eq("notified", false)
      .single();

    if (existing) {
      // Update target price
      await supabaseAdmin
        .from("price_alerts")
        .update({ target_price })
        .eq("id", existing.id);
      return NextResponse.json({ success: true, updated: true });
    }

    const { error } = await supabaseAdmin.from("price_alerts").insert({
      product_id,
      device_id,
      target_price,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[price-alert] POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/alerts/price — Remove a price alert.
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
      .from("price_alerts")
      .delete()
      .eq("product_id", productId)
      .eq("device_id", deviceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[price-alert] DELETE error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * GET /api/alerts/price — Check if user has a price alert for a product.
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
      .from("price_alerts")
      .select("id, target_price, notified")
      .eq("product_id", productId)
      .eq("device_id", deviceId)
      .eq("notified", false)
      .single();

    return NextResponse.json({ alert: alert || null });
  } catch (error) {
    return NextResponse.json({ alert: null });
  }
}
