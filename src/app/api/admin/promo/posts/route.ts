import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/api";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "").split(",").map((s) => s.trim()).filter(Boolean);

async function verifyAdmin() {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !ADMIN_IDS.includes(user.id)) return null;
  return user;
}

// GET /api/admin/promo/posts — list all promo posts across all stores
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const platform = searchParams.get("platform") || "";
    const limit = parseInt(searchParams.get("limit") || "100");

    // Query promo_posts with store and product joins
    let query = supabaseAdmin
      .from("promo_posts")
      .select(`
        id,
        store_id,
        product_id,
        platform,
        status,
        message_id,
        error,
        caption,
        posted_at,
        created_at,
        stores (name),
        products (name, image_url)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (platform && platform !== "all") {
      query = query.eq("platform", platform);
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    // Also get scheduled posts
    let scheduledQuery = supabaseAdmin
      .from("scheduled_promo_posts")
      .select(`
        id,
        store_id,
        product_id,
        platform,
        status,
        error,
        scheduled_at,
        posted_at,
        created_at,
        stores (name),
        products (name, image_url)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") {
      scheduledQuery = scheduledQuery.eq("status", status);
    }
    if (platform && platform !== "all") {
      scheduledQuery = scheduledQuery.eq("platform", platform);
    }

    const { data: scheduledPosts, error: scheduledError } = await scheduledQuery;
    if (scheduledError) throw scheduledError;

    // Merge and format both lists
    const allPosts = [
      ...(posts || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        store_id: p.store_id,
        store_name: (p.stores as Record<string, unknown>)?.name || "Unknown",
        product_id: p.product_id,
        product_name: (p.products as Record<string, unknown>)?.name || "Unknown",
        product_image: (p.products as Record<string, unknown>)?.image_url,
        platform: p.platform,
        status: p.status,
        error: p.error,
        caption: p.caption,
        message_id: p.message_id,
        posted_at: p.posted_at,
        created_at: p.created_at,
        source: "promo_posts",
      })),
      ...(scheduledPosts || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        store_id: p.store_id,
        store_name: (p.stores as Record<string, unknown>)?.name || "Unknown",
        product_id: p.product_id,
        product_name: (p.products as Record<string, unknown>)?.name || "Unknown",
        product_image: (p.products as Record<string, unknown>)?.image_url,
        platform: p.platform,
        status: p.status,
        error: p.error,
        scheduled_at: p.scheduled_at,
        posted_at: p.posted_at,
        created_at: p.created_at,
        source: "scheduled_promo_posts",
      })),
    ].sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());

    return NextResponse.json({ posts: allPosts });
  } catch (error) {
    console.error("Error fetching promo posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
