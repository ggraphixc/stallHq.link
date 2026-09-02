import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/api";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const authSupabase = await createAuthClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("store_id");
    const period = searchParams.get("period") || "7d";

    if (!storeId) {
      return NextResponse.json({ error: "store_id is required" }, { status: 400 });
    }

    // Verify user owns this store
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("user_id", user.id)
      .single();

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Calculate date range
    const now = new Date();
    const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
    const days = daysMap[period] || 7;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Query the aggregated table (fast — single indexed query)
    const { data: aggregates, error } = await supabase
      .from("analytics_aggregates")
      .select("date, visits, whatsapp_clicks, product_views, unique_visitors")
      .eq("store_id", storeId)
      .gte("date", startDateStr)
      .order("date", { ascending: true });

    if (error) {
      console.error("[AnalyticsRollup] Query error:", error);
      // Fall back to empty data rather than crashing
      return NextResponse.json({
        totalVisits: 0,
        whatsappClicks: 0,
        productViews: 0,
        conversionRate: "0",
        chartData: [],
        uniqueVisitors: 0,
      });
    }

    if (!aggregates || aggregates.length === 0) {
      return NextResponse.json({
        totalVisits: 0,
        whatsappClicks: 0,
        productViews: 0,
        conversionRate: "0",
        chartData: [],
        uniqueVisitors: 0,
      });
    }

    // Build a map for quick lookup
    const aggMap = new Map<string, typeof aggregates[0]>();
    for (const row of aggregates) {
      aggMap.set(row.date, row);
    }

    // Fill in missing days with zeros
    const chartData: Array<{ date: string; visits: number; clicks: number; views: number }> = [];
    let totalVisits = 0;
    let totalClicks = 0;
    let totalViews = 0;
    let totalUnique = 0;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const agg = aggMap.get(dateStr);

      const visits = agg?.visits || 0;
      const clicks = agg?.whatsapp_clicks || 0;
      const views = agg?.product_views || 0;

      totalVisits += visits;
      totalClicks += clicks;
      totalViews += views;
      totalUnique += agg?.unique_visitors || 0;

      chartData.push({ date: dateStr, visits, clicks, views });
    }

    // Compare with previous period for trend
    const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStartStr = prevStartDate.toISOString().split("T")[0];
    const prevEndStr = startDateStr;

    const { data: prevAggregates } = await supabase
      .from("analytics_aggregates")
      .select("visits, whatsapp_clicks, product_views")
      .eq("store_id", storeId)
      .gte("date", prevStartStr)
      .lt("date", prevEndStr);

    let prevVisits = 0;
    let prevClicks = 0;
    let prevViews = 0;
    if (prevAggregates) {
      for (const row of prevAggregates) {
        prevVisits += row.visits || 0;
        prevClicks += row.whatsapp_clicks || 0;
        prevViews += row.product_views || 0;
      }
    }

    const calcTrend = (current: number, previous: number): number | undefined => {
      if (previous === 0) return current > 0 ? 100 : undefined;
      return Math.round(((current - previous) / previous) * 100);
    };

    // ── Week-over-week comparison ──────────────────────────────────────────
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const { data: thisWeek } = await supabase
      .from("analytics_aggregates")
      .select("visits, whatsapp_clicks, product_views")
      .eq("store_id", storeId)
      .gte("date", thisWeekStart.toISOString().split("T")[0]);

    const { data: lastWeek } = await supabase
      .from("analytics_aggregates")
      .select("visits, whatsapp_clicks, product_views")
      .eq("store_id", storeId)
      .gte("date", lastWeekStart.toISOString().split("T")[0])
      .lt("date", thisWeekStart.toISOString().split("T")[0]);

    const sumMetrics = (rows: typeof thisWeek) => {
      let v = 0, c = 0, p = 0;
      if (rows) for (const r of rows) { v += r.visits || 0; c += r.whatsapp_clicks || 0; p += r.product_views || 0; }
      return { visits: v, clicks: c, views: p };
    };

    const thisWeekMetrics = sumMetrics(thisWeek);
    const lastWeekMetrics = sumMetrics(lastWeek);

    // ── Month-over-month comparison ────────────────────────────────────────
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const { data: thisMonth } = await supabase
      .from("analytics_aggregates")
      .select("visits, whatsapp_clicks, product_views")
      .eq("store_id", storeId)
      .gte("date", thisMonthStart.toISOString().split("T")[0]);

    const { data: lastMonth } = await supabase
      .from("analytics_aggregates")
      .select("visits, whatsapp_clicks, product_views")
      .eq("store_id", storeId)
      .gte("date", lastMonthStart.toISOString().split("T")[0])
      .lt("date", thisMonthStart.toISOString().split("T")[0]);

    const thisMonthMetrics = sumMetrics(thisMonth);
    const lastMonthMetrics = sumMetrics(lastMonth);

    // ── Best/worst day analysis ───────────────────────────────────────────
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayTotals: Record<number, { visits: number; clicks: number; views: number; count: number }> = {};
    for (const d of chartData) {
      const dow = new Date(d.date).getDay();
      if (!dayTotals[dow]) dayTotals[dow] = { visits: 0, clicks: 0, views: 0, count: 0 };
      dayTotals[dow].visits += d.visits;
      dayTotals[dow].clicks += d.clicks;
      dayTotals[dow].views += d.views;
      dayTotals[dow].count++;
    }

    const dayOfWeekAvg = dayNames.map((name, i) => {
      const t = dayTotals[i];
      if (!t || t.count === 0) return { day: name, avgVisits: 0, avgClicks: 0, totalVisits: 0 };
      return {
        day: name,
        avgVisits: Math.round(t.visits / t.count),
        avgClicks: Math.round(t.clicks / t.count),
        totalVisits: t.visits,
      };
    });

    // Best/worst by total visits
    const sortedDays = [...dayOfWeekAvg].filter((d) => d.totalVisits > 0).sort((a, b) => b.totalVisits - a.totalVisits);
    const bestDay = sortedDays[0] || null;
    const worstDay = sortedDays.length > 1 ? sortedDays[sortedDays.length - 1] : null;

    // Best/worst individual dates
    const sortedDates = [...chartData].sort((a, b) => b.visits - a.visits);
    const bestDate = sortedDates[0] || null;
    const worstDate = sortedDates.length > 1 ? sortedDates[sortedDates.length - 1] : null;

    // ── Conversion funnel ──────────────────────────────────────────────────
    // Get order count for the period
    const { count: orderCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("store_id", storeId)
      .gte("created_at", startDate.toISOString());

    return NextResponse.json({
      totalVisits,
      whatsappClicks: totalClicks,
      productViews: totalViews,
      uniqueVisitors: totalUnique,
      conversionRate:
        totalVisits > 0
          ? ((totalClicks / totalVisits) * 100).toFixed(1)
          : "0",
      chartData,
      visitsTrend: calcTrend(totalVisits, prevVisits),
      viewsTrend: calcTrend(totalViews, prevViews),
      weekOverWeek: {
        visits: { current: thisWeekMetrics.visits, previous: lastWeekMetrics.visits, trend: calcTrend(thisWeekMetrics.visits, lastWeekMetrics.visits) },
        clicks: { current: thisWeekMetrics.clicks, previous: lastWeekMetrics.clicks, trend: calcTrend(thisWeekMetrics.clicks, lastWeekMetrics.clicks) },
        views: { current: thisWeekMetrics.views, previous: lastWeekMetrics.views, trend: calcTrend(thisWeekMetrics.views, lastWeekMetrics.views) },
      },
      monthOverMonth: {
        visits: { current: thisMonthMetrics.visits, previous: lastMonthMetrics.visits, trend: calcTrend(thisMonthMetrics.visits, lastMonthMetrics.visits) },
        clicks: { current: thisMonthMetrics.clicks, previous: lastMonthMetrics.clicks, trend: calcTrend(thisMonthMetrics.clicks, lastMonthMetrics.clicks) },
        views: { current: thisMonthMetrics.views, previous: lastMonthMetrics.views, trend: calcTrend(thisMonthMetrics.views, lastMonthMetrics.views) },
      },
      dayOfWeek: dayOfWeekAvg,
      bestDay,
      worstDay,
      bestDate: bestDate ? { date: bestDate.date, visits: bestDate.visits } : null,
      worstDate: worstDate ? { date: worstDate.date, visits: worstDate.visits } : null,
      funnel: {
        visits: totalVisits,
        clicks: totalClicks,
        orders: orderCount || 0,
      },
    });
  } catch (error) {
    console.error("[AnalyticsRollup] Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
