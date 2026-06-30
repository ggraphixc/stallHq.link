import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, postPromo, buildCaption, logPromoPost, type Platform } from "@/lib/social-post";

interface AutoPostRequest {
  productId: string;
  storeSlug: string;
  platform: Platform;
}

export async function POST(req: NextRequest) {
  try {
    const body: AutoPostRequest = await req.json();
    const { productId, storeSlug, platform } = body;

    if (!productId || !storeSlug || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (platform !== "whatsapp" && platform !== "instagram") {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, name, slug, whatsapp_number, instagram_handle")
      .eq("slug", storeSlug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, price, image_url")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const caption = buildCaption(product, store);
    const result = await postPromo({ platform, store, product, caption });

    // Non-fatal: logging must never mask a success with a 500
    await logPromoPost({ storeId: store.id, productId, platform, result, caption });

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    }
    return NextResponse.json({ error: result.error || "Failed to post" }, { status: 500 });
  } catch (error) {
    console.error("Auto-post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
