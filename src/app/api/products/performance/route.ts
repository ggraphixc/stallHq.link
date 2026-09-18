import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/products/performance?store_id=xxx
 * Returns per-product performance metrics: views, clicks, orders, revenue.
 * Uses the analytics table for views/clicks and orders table for orders/revenue.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("store_id");

    if (!storeId) {
      return NextResponse.json({ error: "store_id required" }, { status: 400 });
    }

    // Verify auth (vendor owns the store)
    const authHeader = request.headers.get("x-access-token");
    if (authHeader) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader);
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: store } = await supabaseAdmin
        .from("stores")
        .select("user_id")
        .eq("id", storeId)
        .single();

      if (!store || store.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get all products for this store
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, name, price, image_url, in_stock, category")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (!products) return NextResponse.json({ products: [] });

    const productIds = products.map((p) => p.id);

    // Get view counts per product (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: views } = await supabaseAdmin
      .from("analytics")
      .select("product_id")
      .eq("store_id", storeId)
      .eq("event_type", "product_view")
      .gte("created_at", thirtyDaysAgo)
      .not("product_id", "is", null);

    // Get WhatsApp click counts per product
    const { data: clicks } = await supabaseAdmin
      .from("analytics")
      .select("product_id")
      .eq("store_id", storeId)
      .eq("event_type", "whatsapp_click")
      .gte("created_at", thirtyDaysAgo)
      .not("product_id", "is", null);

    // Get order counts and revenue per product
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("items, total")
      .eq("store_id", storeId)
      .gte("created_at", thirtyDaysAgo);

    // Aggregate views
    const viewCounts = new Map<string, number>();
    for (const v of views || []) {
      const pid = v.product_id as string;
      viewCounts.set(pid, (viewCounts.get(pid) || 0) + 1);
    }

    // Aggregate clicks
    const clickCounts = new Map<string, number>();
    for (const c of clicks || []) {
      const pid = c.product_id as string;
      clickCounts.set(pid, (clickCounts.get(pid) || 0) + 1);
    }

    // Aggregate orders and revenue per product
    const orderCounts = new Map<string, number>();
    const revenueMap = new Map<string, number>();
    for (const o of orders || []) {
      const items = o.items as any[];
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const pid = item.product_id;
        if (productIds.includes(pid)) {
          orderCounts.set(pid, (orderCounts.get(pid) || 0) + (item.quantity || 1));
          revenueMap.set(pid, (revenueMap.get(pid) || 0) + (item.price || 0) * (item.quantity || 1));
        }
      }
    }

    // Build performance data
    const performance = products.map((p) => {
      const views = viewCounts.get(p.id) || 0;
      const clicks = clickCounts.get(p.id) || 0;
      const orders = orderCounts.get(p.id) || 0;
      const revenue = revenueMap.get(p.id) || 0;
      const conversionRate = views > 0 ? ((orders / views) * 100).toFixed(1) : "0.0";

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: p.image_url,
        in_stock: p.in_stock,
        category: p.category,
        views,
        clicks,
        orders,
        revenue,
        conversion_rate: parseFloat(conversionRate),
      };
    });

    // Sort by revenue descending
    performance.sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({ products: performance });
  } catch (error) {
    console.error("[performance] GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
