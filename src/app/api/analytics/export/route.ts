import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/api";

/**
 * GET /api/analytics/export?store_id=xxx&period=30
 * Returns CSV download of vendor analytics data.
 * Includes: daily visits, clicks, orders, revenue.
 */
export async function GET(request: NextRequest) {
  try {
    const authSupabase = await createAuthClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("store_id");
    const period = parseInt(searchParams.get("period") || "30", 10);

    if (!storeId) {
      return NextResponse.json({ error: "store_id required" }, { status: 400 });
    }

    // Verify ownership
    const { data: store } = await authSupabase
      .from("stores")
      .select("id, name")
      .eq("id", storeId)
      .eq("user_id", user.id)
      .single();

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Date range
    const now = new Date();
    const startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
    const sinceISO = startDate.toISOString();

    // Fetch analytics events
    const { data: events } = await supabase
      .from("analytics")
      .select("event_type, created_at")
      .eq("store_id", storeId)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true });

    // Fetch orders
    const { data: orders } = await supabase
      .from("orders")
      .select("total, status, created_at")
      .eq("store_id", storeId)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true });

    // Build daily data
    const dailyData: Record<string, { visits: number; clicks: number; orders: number; revenue: number }> = {};

    // Initialize all days
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const day = d.toISOString().split("T")[0];
      dailyData[day] = { visits: 0, clicks: 0, orders: 0, revenue: 0 };
    }

    // Count events
    (events || []).forEach((e: any) => {
      const day = String(e.created_at).split("T")[0];
      if (!dailyData[day]) dailyData[day] = { visits: 0, clicks: 0, orders: 0, revenue: 0 };
      if (e.event_type === "visit") dailyData[day].visits++;
      else if (e.event_type === "whatsapp_click") dailyData[day].clicks++;
    });

    // Count orders
    (orders || []).forEach((o: any) => {
      const day = String(o.created_at).split("T")[0];
      if (!dailyData[day]) dailyData[day] = { visits: 0, clicks: 0, orders: 0, revenue: 0 };
      if (o.status !== "cancelled") {
        dailyData[day].orders++;
        dailyData[day].revenue += Number(o.total) || 0;
      }
    });

    // Build CSV
    const headers = ["Date", "Visits", "WhatsApp Clicks", "Orders", "Revenue (₦)"];
    const rows = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => [
        date,
        d.visits.toString(),
        d.clicks.toString(),
        d.orders.toString(),
        d.revenue.toFixed(2),
      ]);

    // Summary row
    const totals = Object.values(dailyData).reduce(
      (acc, d) => ({
        visits: acc.visits + d.visits,
        clicks: acc.clicks + d.clicks,
        orders: acc.orders + d.orders,
        revenue: acc.revenue + d.revenue,
      }),
      { visits: 0, clicks: 0, orders: 0, revenue: 0 }
    );

    rows.push([]);
    rows.push(["TOTAL", totals.visits.toString(), totals.clicks.toString(), totals.orders.toString(), totals.revenue.toFixed(2)]);
    rows.push([]);
    rows.push([`Store: ${store.name}`]);
    rows.push([`Period: Last ${period} days`]);
    rows.push([`Generated: ${now.toISOString()}`]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="stallhq-analytics-${store.name}-${period}d.csv"`,
      },
    });
  } catch (error) {
    console.error("[export] GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
