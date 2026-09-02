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
    });
  } catch (error) {
    console.error("[AnalyticsRollup] Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
