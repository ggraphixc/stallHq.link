import { NextRequest, NextResponse } from "next/server";
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

// GET /api/admin/stores — list all stores with product counts
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const plan = searchParams.get("plan") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("stores")
    .select("*", { count: "exact" });

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  }
  if (plan && plan !== "all") {
    query = query.eq("plan", plan);
  }

  const { data: stores, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get product counts for each store
  const storeIds = (stores || []).map(s => s.id);
  const { data: productCounts } = await supabaseAdmin
    .from("products")
    .select("store_id")
    .in("store_id", storeIds);

  const counts: Record<string, number> = {};
  (productCounts || []).forEach(p => {
    counts[p.store_id] = (counts[p.store_id] || 0) + 1;
  });

  const storesWithCounts = (stores || []).map(s => ({
    ...s,
    product_count: counts[s.id] || 0,
  }));

  // Filter by status after count
  let filtered = storesWithCounts;
  if (status === "active") {
    const now = new Date();
    filtered = filtered.filter(s => {
      if (s.plan === "trial") return s.trial_ends_at && new Date(s.trial_ends_at) > now;
      return s.subscription_expires_at && new Date(s.subscription_expires_at) > now;
    });
  } else if (status === "expired") {
    const now = new Date();
    filtered = filtered.filter(s => {
      if (s.plan === "trial") return !s.trial_ends_at || new Date(s.trial_ends_at) <= now;
      return s.subscription_expires_at && new Date(s.subscription_expires_at) <= now;
    });
  }

    return NextResponse.json({
      stores: filtered,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json({ error: "Failed to fetch stores" }, { status: 500 });
  }
}
