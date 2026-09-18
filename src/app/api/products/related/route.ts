import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/products/related?product_id=xxx&limit=6
 * Returns related products from the same store and/or same category.
 * Priority: same store + same category > same store > same category > popular.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");
    const limit = Math.min(parseInt(searchParams.get("limit") || "6"), 12);

    if (!productId) {
      return NextResponse.json({ error: "product_id required" }, { status: 400 });
    }

    // Get the source product
    const { data: source } = await supabaseAdmin
      .from("products")
      .select("id, store_id, category")
      .eq("id", productId)
      .single();

    if (!source) {
      return NextResponse.json({ products: [] });
    }

    const seenIds = new Set([productId]);
    const results: any[] = [];

    // Tier 1: Same store + same category (best match)
    if (source.category) {
      const { data: tier1 } = await supabaseAdmin
        .from("products")
        .select("id, name, price, images, category, store_id, stores(id, slug, name, logo_url)")
        .eq("store_id", source.store_id)
        .eq("category", source.category)
        .eq("in_stock", true)
        .neq("id", productId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (tier1) {
        for (const p of tier1) {
          if (!seenIds.has(p.id) && results.length < limit) {
            seenIds.add(p.id);
            results.push({ ...p, match_reason: "same_store_category" });
          }
        }
      }
    }

    // Tier 2: Same store, different category
    if (results.length < limit) {
      const { data: tier2 } = await supabaseAdmin
        .from("products")
        .select("id, name, price, images, category, store_id, stores(id, slug, name, logo_url)")
        .eq("store_id", source.store_id)
        .eq("in_stock", true)
        .neq("id", productId)
        .order("created_at", { ascending: false })
        .limit(limit * 2);

      if (tier2) {
        for (const p of tier2) {
          if (!seenIds.has(p.id) && results.length < limit) {
            seenIds.add(p.id);
            results.push({ ...p, match_reason: "same_store" });
          }
        }
      }
    }

    // Tier 3: Same category, different store
    if (results.length < limit && source.category) {
      const { data: tier3 } = await supabaseAdmin
        .from("products")
        .select("id, name, price, images, category, store_id, stores(id, slug, name, logo_url)")
        .eq("category", source.category)
        .eq("in_stock", true)
        .neq("id", productId)
        .order("created_at", { ascending: false })
        .limit(limit * 2);

      if (tier3) {
        for (const p of tier3) {
          if (!seenIds.has(p.id) && results.length < limit) {
            seenIds.add(p.id);
            results.push({ ...p, match_reason: "same_category" });
          }
        }
      }
    }

    // Tier 4: Popular products (most recent from paid stores)
    if (results.length < limit) {
      const { data: tier4 } = await supabaseAdmin
        .from("products")
        .select("id, name, price, images, category, store_id, stores(id, slug, name, logo_url, plan)")
        .eq("in_stock", true)
        .neq("id", productId)
        .order("created_at", { ascending: false })
        .limit(limit * 3);

      if (tier4) {
        // Sort by store plan priority
        const planPriority: Record<string, number> = { annual: 4, quarterly: 3, monthly: 2, trial: 1 };
        const sorted = tier4
          .filter((p) => !seenIds.has(p.id))
          .sort((a, b) => (planPriority[(b.stores as any)?.plan] || 0) - (planPriority[(a.stores as any)?.plan] || 0));

        for (const p of sorted) {
          if (results.length < limit) {
            seenIds.add(p.id);
            results.push({ ...p, match_reason: "popular" });
          }
        }
      }
    }

    // Strip match_reason from final output
    const clean = results.map(({ match_reason, ...rest }) => rest);

    return NextResponse.json({ products: clean });
  } catch (error) {
    console.error("[related] GET error:", error);
    return NextResponse.json({ products: [] });
  }
}
