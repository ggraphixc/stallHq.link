import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/api";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "").split(",").map(s => s.trim()).filter(Boolean);

async function verifyAdmin() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_IDS.includes(user.id)) return null;
  return user;
}

export const dynamic = "force-dynamic";

// GET /api/admin/activity — recent orders, stores, reviews for activity feed
export async function GET(request: Request) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const since = url.searchParams.get("since"); // ISO timestamp for polling

  const sinceFilter = since ? new Date(since).toISOString() : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Fetch recent orders, stores, reviews in parallel
  const [ordersResult, storesResult, reviewsResult] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("id, store_id, customer_name, total, status, items, created_at")
      .gte("created_at", sinceFilter)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabaseAdmin
      .from("stores")
      .select("id, name, slug, plan, whatsapp_number, instagram_handle, created_at")
      .gte("created_at", sinceFilter)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabaseAdmin
      .from("reviews")
      .select("id, store_id, product_id, reviewer_name, rating, comment, created_at")
      .gte("created_at", sinceFilter)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  // Fetch store names for orders and reviews
  const storeIds = new Set<string>();
  (ordersResult.data || []).forEach(o => storeIds.add(o.store_id));
  (reviewsResult.data || []).forEach(r => storeIds.add(r.store_id));

  let storeMap: Record<string, { name: string; slug: string }> = {};
  if (storeIds.size > 0) {
    const { data: stores } = await supabaseAdmin
      .from("stores")
      .select("id, name, slug")
      .in("id", Array.from(storeIds));
    (stores || []).forEach(s => { storeMap[s.id] = { name: s.name, slug: s.slug }; });
  }

  // Normalize into unified activity items
  type ActivityItem = {
    id: string;
    type: "order" | "store" | "review";
    created_at: string;
    data: any;
  };

  const activities: ActivityItem[] = [
    ...(ordersResult.data || []).map(o => ({
      id: o.id,
      type: "order" as const,
      created_at: o.created_at,
      data: {
        customer_name: o.customer_name,
        total: o.total,
        status: o.status,
        item_count: Array.isArray(o.items) ? o.items.length : 0,
        store_name: storeMap[o.store_id]?.name || "Unknown",
        store_slug: storeMap[o.store_id]?.slug || "",
      },
    })),
    ...(storesResult.data || []).map(s => ({
      id: s.id,
      type: "store" as const,
      created_at: s.created_at,
      data: {
        name: s.name,
        slug: s.slug,
        plan: s.plan,
        channel: s.whatsapp_number && s.instagram_handle ? "both"
          : s.whatsapp_number ? "whatsapp"
          : s.instagram_handle ? "instagram"
          : "none",
      },
    })),
    ...(reviewsResult.data || []).map(r => ({
      id: r.id,
      type: "review" as const,
      created_at: r.created_at,
      data: {
        reviewer_name: r.reviewer_name,
        rating: r.rating,
        comment: r.comment,
        store_name: storeMap[r.store_id]?.name || "Unknown",
        store_slug: storeMap[r.store_id]?.slug || "",
      },
    })),
  ];

  // Sort by created_at descending and limit
  activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const limited = activities.slice(0, limit);

  return NextResponse.json({ activities: limited }, {
    headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
  });
}
