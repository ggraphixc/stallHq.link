import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/analytics/revenue?store_id=xxx&days=30
 * Returns revenue metrics: total, this period, last period, trend, daily breakdown.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("store_id");
    const days = Math.min(parseInt(searchParams.get("days") || "30"), 365);

    if (!storeId) {
      return NextResponse.json({ error: "store_id required" }, { status: 400 });
    }

    // Verify auth
    const authHeader = request.headers.get("x-access-token");
    if (authHeader) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader);
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: store } = await supabaseAdmin
        .from("stores")
        .select("user_id")
        .eq("id", storeId)
        .single();

      if (!store || store.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const lastPeriodStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch all orders for this store in the last 2 periods
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, total, items, created_at, status")
      .eq("store_id", storeId)
      .gte("created_at", lastPeriodStart.toISOString())
      .not("status", "eq", "cancelled");

    if (!orders) return NextResponse.json({ revenue: { total: 0, this_period: 0, last_period: 0, trend: 0, daily: [] } });

    let thisPeriodRevenue = 0;
    let lastPeriodRevenue = 0;
    const dailyRevenue = new Map<string, number>();

    for (const order of orders) {
      const revenue = Number(order.total) || 0;
      const orderDate = new Date(order.created_at);

      if (orderDate >= periodStart) {
        thisPeriodRevenue += revenue;
        const dayKey = orderDate.toISOString().split("T")[0];
        dailyRevenue.set(dayKey, (dailyRevenue.get(dayKey) || 0) + revenue);
      } else if (orderDate >= lastPeriodStart) {
        lastPeriodRevenue += revenue;
      }
    }

    // Calculate trend
    const trend = lastPeriodRevenue > 0
      ? Math.round(((thisPeriodRevenue - lastPeriodRevenue) / lastPeriodRevenue) * 100)
      : thisPeriodRevenue > 0 ? 100 : 0;

    // Build daily array for the chart
    const daily: { date: string; revenue: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      daily.push({
        date: key,
        revenue: dailyRevenue.get(key) || 0,
      });
    }

    return NextResponse.json({
      revenue: {
        total: thisPeriodRevenue + lastPeriodRevenue,
        this_period: thisPeriodRevenue,
        last_period: lastPeriodRevenue,
        trend,
        daily,
        order_count: orders.filter((o) => new Date(o.created_at) >= periodStart).length,
      },
    });
  } catch (error) {
    console.error("[revenue] GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
