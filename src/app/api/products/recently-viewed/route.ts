import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/products/recently-viewed — Record a product view.
 * Body: { product_id, device_id?, user_id? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, device_id } = body;

    if (!product_id) {
      return NextResponse.json({ error: "product_id required" }, { status: 400 });
    }

    // Resolve user_id if authenticated (optional)
    let userId: string | null = null;
    const authHeader = request.headers.get("x-access-token");
    if (authHeader) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader);
      if (user) userId = user.id;
    }

    // Get the product's store_id
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("store_id")
      .eq("id", product_id)
      .single();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Deduplicate: delete existing view for this device/product pair in the last hour
    const deviceId = device_id || userId || "anonymous";
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from("recently_viewed")
      .delete()
      .eq("product_id", product_id)
      .eq("device_id", deviceId)
      .gte("viewed_at", oneHourAgo);

    // Insert new view
    const { error } = await supabaseAdmin.from("recently_viewed").insert({
      device_id: deviceId,
      user_id: userId,
      product_id,
      store_id: product.store_id,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[recently-viewed] POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * GET /api/products/recently-viewed?device_id=xxx&limit=10
 * Returns the user's recently viewed products.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("device_id");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

    if (!deviceId) {
      return NextResponse.json({ products: [] });
    }

    // Get recently viewed product IDs (deduplicated)
    const { data: views } = await supabaseAdmin
      .from("recently_viewed")
      .select("product_id")
      .eq("device_id", deviceId)
      .order("viewed_at", { ascending: false })
      .limit(limit * 2);

    if (!views || views.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Deduplicate product IDs (keep first occurrence = most recent)
    const seen = new Set<string>();
    const uniqueIds = views
      .filter((v) => {
        if (seen.has(v.product_id)) return false;
        seen.add(v.product_id);
        return true;
      })
      .slice(0, limit)
      .map((v) => v.product_id);

    // Fetch full product + store data
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, name, price, images, category, in_stock, store_id, stores(id, slug, name, logo_url)")
      .in("id", uniqueIds)
      .eq("in_stock", true);

    if (!products) return NextResponse.json({ products: [] });

    // Preserve order (most recent first)
    const productMap = new Map(products.map((p) => [p.id, p]));
    const ordered = uniqueIds
      .map((id) => productMap.get(id))
      .filter(Boolean)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        images: p.images,
        category: p.category,
        store: p.stores,
      }));

    return NextResponse.json({ products: ordered });
  } catch (error) {
    console.error("[recently-viewed] GET error:", error);
    return NextResponse.json({ products: [] });
  }
}
