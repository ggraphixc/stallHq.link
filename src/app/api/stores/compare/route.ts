import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/stores/compare?ids=slug1,slug2,slug3
 * Returns side-by-side comparison data for 2-4 stores.
 * Includes: products count, avg rating, response time, plan, category, price ranges.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ error: "ids query param required (comma-separated slugs)" }, { status: 400 });
    }

    const slugs = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);

    if (slugs.length < 2) {
      return NextResponse.json({ error: "At least 2 store slugs required" }, { status: 400 });
    }

    // Fetch stores
    const { data: stores } = await supabaseAdmin
      .from("stores")
      .select("id, slug, name, description, logo_url, banner_url, category, plan, verified, created_at")
      .in("slug", slugs)
      .eq("setup_complete", true);

    if (!stores || stores.length < 2) {
      return NextResponse.json({ error: "Could not find enough stores" }, { status: 404 });
    }

    const storeIds = stores.map((s) => s.id);

    // Fetch product counts and price ranges per store
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("store_id, price, in_stock")
      .in("store_id", storeIds);

    // Fetch review stats per store
    const { data: reviews } = await supabaseAdmin
      .from("reviews")
      .select("store_id, rating")
      .in("store_id", storeIds);

    // Fetch order counts per store (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("store_id")
      .in("store_id", storeIds)
      .gte("created_at", thirtyDaysAgo);

    // Fetch analytics (visits) per store
    const { data: analytics } = await supabaseAdmin
      .from("analytics")
      .select("store_id")
      .in("store_id", storeIds)
      .eq("event_type", "visit")
      .gte("created_at", thirtyDaysAgo);

    // Aggregate per store
    const comparison = stores.map((store) => {
      const storeProducts = (products || []).filter((p) => p.store_id === store.id);
      const inStockProducts = storeProducts.filter((p) => p.in_stock);
      const prices = storeProducts.map((p) => Number(p.price)).filter((p) => p > 0);
      const storeReviews = (reviews || []).filter((r) => r.store_id === store.id);
      const storeOrders = (orders || []).filter((o) => o.store_id === store.id);
      const storeVisits = (analytics || []).filter((a) => a.store_id === store.id);

      const avgRating = storeReviews.length > 0
        ? storeReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / storeReviews.length
        : 0;

      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

      return {
        id: store.id,
        slug: store.slug,
        name: store.name,
        description: store.description,
        logo_url: store.logo_url,
        banner_url: store.banner_url,
        category: store.category,
        plan: store.plan,
        verified: store.verified,
        stats: {
          product_count: inStockProducts.length,
          total_products: storeProducts.length,
          review_count: storeReviews.length,
          avg_rating: Math.round(avgRating * 10) / 10,
          orders_30d: storeOrders.length,
          visits_30d: storeVisits.length,
          price_range: { min: minPrice, max: maxPrice, avg: avgPrice },
        },
      };
    });

    return NextResponse.json({ stores: comparison });
  } catch (error) {
    console.error("[compare] GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
