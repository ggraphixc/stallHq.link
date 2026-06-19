import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Track an analytics event
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body = await request.json();
    const { store_id, event_type, product_id, metadata } = body;

    if (!store_id || !event_type) {
      return NextResponse.json(
        { error: "store_id and event_type are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("analytics").insert({
      store_id,
      event_type,
      product_id: product_id || null,
      metadata: metadata || null,
    });

    if (error) {
      console.error("Analytics insert error:", error);
      return NextResponse.json(
        { error: "Failed to track event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}

// Get analytics for a store
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("store_id");
    const period = searchParams.get("period") || "7d"; // 7d, 30d, 90d

    if (!storeId) {
      return NextResponse.json(
        { error: "store_id is required" },
        { status: 400 }
      );
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
    const daysMap: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
    };
    const days = daysMap[period] || 7;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get total visits
    const { count: totalVisits } = await supabase
      .from("analytics")
      .select("*", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("event_type", "visit")
      .gte("created_at", startDate.toISOString());

    // Get WhatsApp clicks
    const { count: whatsappClicks } = await supabase
      .from("analytics")
      .select("*", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("event_type", "whatsapp_click")
      .gte("created_at", startDate.toISOString());

    // Get product views
    const { count: productViews } = await supabase
      .from("analytics")
      .select("*", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("event_type", "product_view")
      .gte("created_at", startDate.toISOString());

    // Get popular products
    const { data: popularProducts } = await supabase
      .from("analytics")
      .select("product_id, products(name)")
      .eq("store_id", storeId)
      .eq("event_type", "product_view")
      .gte("created_at", startDate.toISOString())
      .not("product_id", "is", null);

    // Count product views
    const productCounts: Record<string, { name: string; count: number }> = {};
    popularProducts?.forEach((item) => {
      if (item.product_id && item.products) {
        // products is an array from Supabase foreign key relation
        const productsArr = item.products as Array<{ name: string }>;
        const productName = productsArr[0]?.name;
        if (productName) {
          if (!productCounts[item.product_id]) {
            productCounts[item.product_id] = { name: productName, count: 0 };
          }
          productCounts[item.product_id].count++;
        }
      }
    });

    const topProducts = Object.entries(productCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get daily visits for chart
    const { data: dailyVisits } = await supabase
      .from("analytics")
      .select("created_at")
      .eq("store_id", storeId)
      .eq("event_type", "visit")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // Group by day
    const visitsByDay: Record<string, number> = {};
    dailyVisits?.forEach((item) => {
      const day = new Date(item.created_at).toISOString().split("T")[0];
      visitsByDay[day] = (visitsByDay[day] || 0) + 1;
    });

    // Fill in missing days
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = date.toISOString().split("T")[0];
      chartData.push({
        date: dayStr,
        visits: visitsByDay[dayStr] || 0,
      });
    }

    return NextResponse.json({
      totalVisits: totalVisits || 0,
      whatsappClicks: whatsappClicks || 0,
      productViews: productViews || 0,
      conversionRate:
        totalVisits && totalVisits > 0
          ? ((whatsappClicks || 0) / totalVisits * 100).toFixed(1)
          : "0",
      topProducts,
      chartData,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
