import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, postPromo, buildCaption, logPromoPost } from "@/lib/social-post";
import { createClient } from "@/lib/supabase/api";

// POST - Immediately post a scheduled promo post
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "postId required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: post, error: fetchError } = await supabase
      .from("scheduled_promo_posts")
      .select(`
        id,
        platform,
        stores (id, name, slug, whatsapp_number, instagram_handle),
        products (id, name, price, image_url)
      `)
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const store = (Array.isArray(post.stores) ? post.stores[0] : post.stores) as
      | { id: string; name: string; slug: string; whatsapp_number?: string | null; instagram_handle?: string | null }
      | null;
    const product = (Array.isArray(post.products) ? post.products[0] : post.products) as
      | { id: string; name: string; price: number; image_url?: string | null }
      | null;

    if (!store || !product) {
      await supabase
        .from("scheduled_promo_posts")
        .update({ status: "failed", error: "Store or product not found" })
        .eq("id", postId);
      return NextResponse.json({ error: "Store or product not found" }, { status: 404 });
    }

    // Verify user owns this store
    const { data: storeOwnership } = await supabase
      .from("stores")
      .select("user_id")
      .eq("id", store.id)
      .single();

    if (!storeOwnership || storeOwnership.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const caption = buildCaption(product, store);
    const result = await postPromo({
      platform: post.platform as "whatsapp" | "instagram",
      store,
      product,
      caption,
    });

    // Update the scheduled post status
    await supabase
      .from("scheduled_promo_posts")
      .update({
        status: result.success ? "posted" : "failed",
        error: result.success ? null : result.error || null,
        posted_at: result.success ? new Date().toISOString() : null,
      })
      .eq("id", postId);

    // Non-fatal audit log
    await logPromoPost({
      storeId: store.id,
      productId: product.id,
      platform: post.platform as "whatsapp" | "instagram",
      result,
      caption,
    });

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    }
    return NextResponse.json({ error: result.error || "Failed to post" }, { status: 500 });
  } catch (error) {
    console.error("Post-now error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
