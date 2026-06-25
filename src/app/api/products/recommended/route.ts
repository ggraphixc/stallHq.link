import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/products/recommended — Fetch recommended products from top stores
// Returns products from stores with higher plans (quarterly/annual get priority)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "6"), 12);

    // Fetch active stores with products, ordered by plan priority
    const planPriority: Record<string, number> = { annual: 4, quarterly: 3, monthly: 2, trial: 1 };

    const { data: stores } = await supabaseAdmin
      .from("stores")
      .select("id, slug, name, logo_url, category, plan")
      .eq("is_active", true)
      .in("plan", ["quarterly", "annual", "monthly"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (!stores || stores.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Fetch products from these stores
    const storeIds = stores.map(s => s.id);
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, name, price, images, store_id, category, in_stock")
      .in("store_id", storeIds)
      .eq("in_stock", true)
      .order("created_at", { ascending: false })
      .limit(limit * 3); // Fetch more to randomize

    if (!products || products.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Enrich products with store info
    const storeMap = new Map(stores.map(s => [s.id, s]));
    const enriched = products
      .filter(p => storeMap.has(p.store_id))
      .map(p => {
        const store = storeMap.get(p.store_id)!;
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          images: p.images,
          category: p.category,
          store: {
            id: store.id,
            slug: store.slug,
            name: store.name,
            logo_url: store.logo_url,
            plan: store.plan,
          },
        };
      })
      .sort((a, b) => (planPriority[b.store.plan] || 0) - (planPriority[a.store.plan] || 0))
      .slice(0, limit);

    return NextResponse.json({ products: enriched });
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    return NextResponse.json({ products: [] });
  }
}
