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

// GET /api/admin/users — list all users with their stores
export async function GET(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  // Get all users from auth
  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
    page,
    perPage: limit,
  });

  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  // Get stores for each user
  const userIds = usersData.users.map(u => u.id);
  const { data: stores } = await supabaseAdmin
    .from("stores")
    .select("id, name, slug, plan, created_at, user_id")
    .in("user_id", userIds);

  // Get order counts per store
  const storeIds = (stores || []).map(s => s.id);
  const { data: orderCounts } = await supabaseAdmin
    .from("orders")
    .select("store_id")
    .in("store_id", storeIds);

  const orderCountMap: Record<string, number> = {};
  (orderCounts || []).forEach(o => {
    orderCountMap[o.store_id] = (orderCountMap[o.store_id] || 0) + 1;
  });

  // Attach stores and order counts to users
  const usersWithStores = usersData.users.map(u => {
    const userStores = (stores || []).filter(s => s.user_id === u.id).map(s => ({
      ...s,
      order_count: orderCountMap[s.id] || 0,
    }));
    return {
      id: u.id,
      email: u.email,
      name: u.user_metadata?.name || null,
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at,
      stores: userStores,
      total_orders: userStores.reduce((sum, s) => sum + (orderCountMap[s.id] || 0), 0),
    };
  });

  return NextResponse.json({
    users: usersWithStores,
    total: usersData.total || 0,
    page,
    limit,
  });
}
