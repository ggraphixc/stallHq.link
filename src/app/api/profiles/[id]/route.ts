import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { apiRateLimit, addRateLimitHeaders } from "@/lib/rateLimit";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await apiRateLimit(request);
  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }

  try {
    const { id } = await params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid profile id" }, { status: 400 });
    }

    const [{ data: profileRes }, { data: storesRes }, authResult] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("user_id, display_name, avatar_url, bio, created_at")
          .eq("user_id", id)
          .maybeSingle(),
        supabaseAdmin
          .from("stores")
          .select("id, name, slug, logo_url, verified, category, created_at")
          .eq("user_id", id)
          .order("created_at", { ascending: true }),
        supabaseAdmin.auth.admin.getUserById(id).catch(() => null),
      ]);

    const profileRow = profileRes;
    const stores = storesRes || [];
    const authUser = authResult?.data?.user ?? null;

    const displayName =
      profileRow?.display_name ||
      authUser?.user_metadata?.name ||
      authUser?.user_metadata?.full_name ||
      (authUser?.email ? authUser.email.split("@")[0] : null) ||
      (stores[0]?.name as string | undefined) ||
      "Member";

    const joinedAt =
      authUser?.created_at || profileRow?.created_at || stores[0]?.created_at || null;

    let reviewCount = 0;
    if (stores.length > 0) {
      const storeIds = stores.map((s) => s.id);
      const { count } = await supabaseAdmin
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .in("store_id", storeIds);
      reviewCount = count || 0;
    }

    return addRateLimitHeaders(
      NextResponse.json(
        {
          user_id: id,
          display_name: displayName,
          avatar_url: profileRow?.avatar_url || null,
          bio: profileRow?.bio || null,
          is_vendor: stores.length > 0,
          joined_at: joinedAt,
          review_count: reviewCount,
          stores: stores.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            logo_url: s.logo_url,
            verified: s.verified,
            category: s.category,
            created_at: s.created_at,
          })),
        },
        {
          headers: {
            "Cache-Control": "public, max-age=60, s-maxage=60",
          },
        }
      ),
      rateLimitResult.headers
    );
  } catch (error) {
    console.error("[profiles] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
