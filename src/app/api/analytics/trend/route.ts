import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

// GET /api/analytics/trend?store_id=xxx — 7-day trend for vendor sparklines
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = request.nextUrl.searchParams.get("store_id");
  if (!storeId) return NextResponse.json({ error: "store_id required" }, { status: 400 });

  // Verify ownership
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  // Build 7-day date keys
  const now = new Date();
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  const sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch analytics, orders, and reviews for last 7 days
  const [analyticsResult, ordersResult] = await Promise.all([
    supabase
      .from("analytics")
      .select("event_type, created_at")
      .eq("store_id", storeId)
      .gte("created_at", sinceDate),
    supabase
      .from("orders")
      .select("status, total, created_at")
      .eq("store_id", storeId)
      .gte("created_at", sinceDate),
  ]);

  const analytics = analyticsResult.data || [];
  const orders = ordersResult.data || [];

  // Build daily counts
  const visitsByDay: Record<string, number> = {};
  const clicksByDay: Record<string, number> = {};
  const ordersByDay: Record<string, number> = {};
  const revenueByDay: Record<string, number> = {};

  analytics.forEach(a => {
    const day = a.created_at.split("T")[0];
    if (a.event_type === "visit") visitsByDay[day] = (visitsByDay[day] || 0) + 1;
    if (a.event_type === "whatsapp_click") clicksByDay[day] = (clicksByDay[day] || 0) + 1;
  });

  orders.forEach(o => {
    const day = o.created_at.split("T")[0];
    ordersByDay[day] = (ordersByDay[day] || 0) + 1;
    if (o.status !== "cancelled") {
      revenueByDay[day] = (revenueByDay[day] || 0) + (o.total || 0);
    }
  });

  // Convert to 7-day arrays
  const visits = days.map(d => visitsByDay[d] || 0);
  const clicks = days.map(d => clicksByDay[d] || 0);
  const ordersArr = days.map(d => ordersByDay[d] || 0);
  const revenue = days.map(d => revenueByDay[d] || 0);

  return NextResponse.json({ visits, clicks, orders: ordersArr, revenue }, {
    headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
  });
}
