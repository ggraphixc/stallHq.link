import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !vercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = {
    aggregated: 0,
    cleaned: 0,
    errors: 0,
    timestamp: now.toISOString(),
  };

  try {
    // ── Step 1: Aggregate yesterday's analytics ──────────────────────────
    // We aggregate the day before yesterday to ensure all events for that day
    // have been inserted (avoids partial aggregates from in-flight requests)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const targetDate = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );
    const targetDateEnd = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    const targetDateISO = targetDate.toISOString();
    const targetDateEndISO = targetDateEnd.toISOString();

    // Get all stores that had analytics activity on the target date
    const { data: activeStores, error: storeError } = await supabase
      .from("analytics")
      .select("store_id")
      .gte("created_at", targetDateISO)
      .lt("created_at", targetDateEndISO);

    if (storeError) {
      console.error("[AnalyticsAggregate] Query error:", storeError);
      results.errors++;
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    if (!activeStores || activeStores.length === 0) {
      console.log("[AnalyticsAggregate] No analytics to aggregate for", targetDateISO);
      return NextResponse.json({ success: true, ...results });
    }

    // Get unique store IDs
    const storeIds = [...new Set(activeStores.map((s) => s.store_id))];

    for (const storeId of storeIds) {
      try {
        // Get all events for this store on the target date
        const { data: events, error: eventsError } = await supabase
          .from("analytics")
          .select("event_type, product_id, metadata")
          .eq("store_id", storeId)
          .gte("created_at", targetDateISO)
          .lt("created_at", targetDateEndISO);

        if (eventsError) {
          console.error(`[AnalyticsAggregate] Events query error for store ${storeId}:`, eventsError);
          results.errors++;
          continue;
        }

        if (!events || events.length === 0) continue;

        // Calculate metrics
        const visits = events.filter((e) => e.event_type === "visit").length;
        const whatsappClicks = events.filter((e) => e.event_type === "whatsapp_click").length;
        const productViews = events.filter((e) => e.event_type === "product_view").length;

        // Count unique visitors from metadata (visitor_id or IP-based)
        const visitorIds = new Set<string>();
        for (const event of events) {
          if (event.metadata && typeof event.metadata === "object") {
            const meta = event.metadata as Record<string, unknown>;
            if (meta.visitor_id) visitorIds.add(String(meta.visitor_id));
          }
        }
        // If no visitor_id in metadata, use a rough estimate
        const uniqueVisitors = visitorIds.size > 0 ? visitorIds.size : Math.ceil(visits * 0.7);

        // Upsert aggregate
        const { error: upsertError } = await supabase
          .from("analytics_aggregates")
          .upsert(
            {
              store_id: storeId,
              date: targetDateISO.split("T")[0],
              visits,
              whatsapp_clicks: whatsappClicks,
              product_views: productViews,
              unique_visitors: uniqueVisitors,
            },
            { onConflict: "store_id,date" }
          );

        if (upsertError) {
          console.error(`[AnalyticsAggregate] Upsert error for store ${storeId}:`, upsertError);
          results.errors++;
        } else {
          results.aggregated++;
        }
      } catch (err) {
        console.error(`[AnalyticsAggregate] Error processing store ${storeId}:`, err);
        results.errors++;
      }
    }

    // ── Step 2: Clean up raw analytics older than 30 days ────────────────
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const { count: rawCount, error: countError } = await supabase
      .from("analytics")
      .select("*", { count: "exact", head: true })
      .lt("created_at", thirtyDaysAgo.toISOString());

    if (!countError && rawCount && rawCount > 0) {
      // Delete in batches of 1000 to avoid timeouts
      let deleted = 0;
      while (deleted < rawCount) {
        const { data: oldRows, error: fetchError } = await supabase
          .from("analytics")
          .select("id")
          .lt("created_at", thirtyDaysAgo.toISOString())
          .limit(1000);

        if (fetchError || !oldRows || oldRows.length === 0) break;

        const ids = oldRows.map((r) => r.id);
        const { error: deleteError } = await supabase
          .from("analytics")
          .delete()
          .in("id", ids);

        if (deleteError) {
          console.error("[AnalyticsAggregate] Delete error:", deleteError);
          results.errors++;
          break;
        }

        deleted += ids.length;
        results.cleaned += ids.length;

        // Small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`[AnalyticsAggregate] Cleaned ${deleted} raw analytics rows older than 30 days`);
    }

    console.log("[AnalyticsAggregate] Done:", results);
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    console.error("[AnalyticsAggregate] Unexpected error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
