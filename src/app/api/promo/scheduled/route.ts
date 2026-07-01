import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/api";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyStoreOwner(storeId: string) {
  const supabaseAuth = await createAuthClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return null;

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .single();

  return store ? user : null;
}

// GET - Fetch scheduled posts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("store_id");

    if (!storeId) {
      return NextResponse.json({ error: "store_id required" }, { status: 400 });
    }

    const user = await verifyStoreOwner(storeId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: posts, error } = await supabase
      .from("scheduled_promo_posts")
      .select(`
        *,
        products (name, image_url, price)
      `)
      .eq("store_id", storeId)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;

    const formattedPosts = (posts || []).map((p: Record<string, unknown>) => ({
      id: p.id,
      product_id: p.product_id,
      product_name: (p.products as Record<string, unknown>)?.name || "Unknown",
      product_image: (p.products as Record<string, unknown>)?.image_url,
      platform: p.platform,
      scheduled_at: p.scheduled_at,
      status: p.status,
      created_at: p.created_at,
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create scheduled post
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, productId, platform, scheduledAt } = body;

    if (!storeId || !productId || !platform || !scheduledAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await verifyStoreOwner(storeId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("scheduled_promo_posts")
      .insert({
        store_id: storeId,
        product_id: productId,
        platform,
        scheduled_at: scheduledAt,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, post: data });
  } catch (error) {
    console.error("Error creating scheduled post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove scheduled post
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    // Verify ownership via the post's store
    const { data: existingPost } = await supabase
      .from("scheduled_promo_posts")
      .select("store_id")
      .eq("id", postId)
      .single();

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const user = await verifyStoreOwner(existingPost.store_id);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("scheduled_promo_posts")
      .delete()
      .eq("id", postId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scheduled post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
