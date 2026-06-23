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

// GET /api/admin/system — platform health and stats
export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Run all queries in parallel
  const [
    storesResult,
    productsResult,
    ordersResult,
    reviewsResult,
    paymentsResult,
    recentOrdersResult,
    recentStoresResult,
  ] = await Promise.all([
    // Total stores
    supabaseAdmin.from("stores").select("id, plan, created_at, trial_ends_at, subscription_expires_at", { count: "exact" }),
    // Total products
    supabaseAdmin.from("products").select("id, store_id, in_stock, created_at", { count: "exact" }),
    // Total orders
    supabaseAdmin.from("orders").select("id, status, total, created_at, store_id", { count: "exact" }),
    // Total reviews
    supabaseAdmin.from("reviews").select("id, rating", { count: "exact" }),
    // Payments
    supabaseAdmin.from("payments").select("id, amount, paystack_status, created_at", { count: "exact" }),
    // Recent orders (last 7 days)
    supabaseAdmin.from("orders").select("id, created_at").gte("created_at", last7d),
    // Recent stores (last 7 days)
    supabaseAdmin.from("stores").select("id, created_at").gte("created_at", last7d),
  ]);

  const stores = storesResult.data || [];
  const products = productsResult.data || [];
  const orders = ordersResult.data || [];
  const reviews = reviewsResult.data || [];
  const payments = paymentsResult.data || [];

  // Compute stats
  const totalStores = stores.length;
  const trialStores = stores.filter(s => s.plan === "trial").length;
  const paidStores = stores.filter(s => s.plan !== "trial").length;
  const activeStores = stores.filter(s => {
    if (s.plan === "trial") return s.trial_ends_at && new Date(s.trial_ends_at) > now;
    return s.subscription_expires_at && new Date(s.subscription_expires_at) > now;
  }).length;

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.in_stock).length;

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const confirmedOrders = orders.filter(o => o.status === "confirmed").length;
  const deliveredOrders = orders.filter(o => o.status === "delivered").length;
  const cancelledOrders = orders.filter(o => o.status === "cancelled").length;

  const totalRevenue = orders
    .filter(o => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const revenueLast7d = orders
    .filter(o => o.status !== "cancelled" && o.created_at >= last7d)
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const successfulPayments = payments.filter(p => p.paystack_status === "success");
  const totalPaymentRevenue = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
    : 0;

  const newStoresLast7d = recentStoresResult.data?.length || 0;
  const newOrdersLast7d = recentOrdersResult.data?.length || 0;

  // Orders by day (last 30 days)
  const ordersByDay: Record<string, number> = {};
  orders.forEach(o => {
    const day = o.created_at.split("T")[0];
    ordersByDay[day] = (ordersByDay[day] || 0) + 1;
  });

  // Revenue by day (last 30 days)
  const revenueByDay: Record<string, number> = {};
  orders.filter(o => o.status !== "cancelled").forEach(o => {
    const day = o.created_at.split("T")[0];
    revenueByDay[day] = (revenueByDay[day] || 0) + (o.total || 0);
  });

  return NextResponse.json({
    overview: {
      totalStores,
      trialStores,
      paidStores,
      activeStores,
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      revenueLast7d,
      totalPaymentRevenue: totalPaymentRevenue / 100,
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      newStoresLast7d,
      newOrdersLast7d,
    },
    charts: {
      ordersByDay,
      revenueByDay,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || "development",
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/\/[^.]+\.supabase\.co/, "//***.supabase.co"),
      hasBrevoKey: !!process.env.BREVO_API_KEY,
      hasPaystackKey: !!process.env.PAYSTACK_SECRET_KEY,
      hasCronSecret: !!process.env.CRON_SECRET,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
}
