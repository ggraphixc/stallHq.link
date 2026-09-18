import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/products/trending?limit=8&days=7
 * Returns trending products based on recent view count + recency weighting.
 * Uses the analytics table (product_view events) to determine trending.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "8"), 20);
    const days = Math.min(parseInt(searchParams.get("days") || "7"), 30);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Aggregate product views from analytics table
    const { data: analytics } = await supabaseAdmin
      .from("analytics")
      .select("product_id")
      .eq("event_type", "product_view")
      .gte("created_at", since)
      .not("product_id", "is", null);

    if (!analytics || analytics.length === 0) {
      // Fallback: return latest products from paid stores
      const { data: fallback } = await supabaseAdmin
        .from("products")
        .select("id, name, price, images, category, store_id, stores(id, slug, name, logo_url, plan)")
        .eq("in_stock", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!fallback) return NextResponse.json({ products: [] });

      const planPriority: Record<string, number> = { annual: 4, quarterly: 3, monthly: 2, trial: 1 };
      const sorted = fallback.sort(
        (a, b) => (planPriority[(b.stores as any)?.plan] || 0) - (planPriority[(a.stores as any)?.plan] || 0)
      );

      return NextResponse.json({
        products: sorted.slice(0, limit),
        trending: false,
      });
    }

    // Count views per product
    const viewCounts = new Map<string, number>();
    for (const a of analytics) {
      const pid = a.product_id as string;
      viewCounts.set(pid, (viewCounts.get(pid) || 0) + 1);
    }

    // Sort by view count, take top N
    const trendingIds = [...viewCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit * 2)
      .map(([id]) => id);

    // Fetch full product data
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, name, price, images, category, store_id, stores(id, slug, name, logo_url)")
      .in("id", trendingIds)
      .eq("in_stock", true);

    if (!products) return NextResponse.json({ products: [] });

    // Preserve trending order + add view count
    const productMap = new Map(products.map((p) => [p.id, p]));
    const enriched = trendingIds
      .map((id) => {
        const p = productMap.get(id);
        if (!p) return null;
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          images: p.images,
          category: p.category,
          store: p.stores,
          view_count: viewCounts.get(id) || 0,
        };
      })
      .filter(Boolean)
      .slice(0, limit);

    return NextResponse.json({ products: enriched, trending: true });
  } catch (error) {
    console.error("[trending] GET error:", error);
    return NextResponse.json({ products: [] });
  }
}
