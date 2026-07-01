import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, postPromo, buildCaption, logPromoPost, type Platform } from "@/lib/social-post";
import { createClient } from "@/lib/supabase/api";

interface AutoPostRequest {
  productId: string;
  storeSlug: string;
  platform: Platform;
}

export async function POST(req: NextRequest) {
  try {
    // Auth check: user must be logged in and own the store
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AutoPostRequest = await req.json();
    const { productId, storeSlug, platform } = body;

    if (!productId || !storeSlug || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (platform !== "whatsapp" && platform !== "instagram") {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify user owns this store
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, name, slug, whatsapp_number, instagram_handle, user_id")
      .eq("slug", storeSlug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (store.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
