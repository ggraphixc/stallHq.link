import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { adminClient } from "@/lib/ai";
import { apiRateLimit, addRateLimitHeaders } from "@/lib/rateLimit";

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const REASONS = ["fake", "counterfeit", "misleading", "prohibited", "offensive", "other"];

// POST /api/reports — submit a report about a product
// Insert runs server-side with the service role (RLS select policies only let
// store owners read report rows, so an anon read-back would 500 after a
// successful insert). Validation + rate limiting still apply here.
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (!rateLimitResult.success) return rateLimitResult.response!;

    const { product_id, store_id, reason, details, reporter_name, reporter_email } = await request.json();

    if (!product_id || !store_id) {
      return NextResponse.json({ error: "product_id and store_id required" }, { status: 400 });
    }
    if (!reason || !REASONS.includes(reason)) {
      return NextResponse.json({ error: "Valid reason required" }, { status: 400 });
    }
    if (details && details.length > 1000) {
      return NextResponse.json({ error: "Details must be 1000 characters or less" }, { status: 400 });
    }

    const admin = adminClient();
    const { data, error } = await admin
      .from("product_reports")
      .insert({
        product_id,
        store_id,
        reason,
        details: details || null,
        reporter_name: reporter_name?.slice(0, 100) || null,
        reporter_email: reporter_email?.slice(0, 255) || null,
      })
      .select()
      .single();

    if (error) throw error;

    return addRateLimitHeaders(NextResponse.json(data, { status: 201 }), rateLimitResult.headers);
  } catch (error) {
    console.error("Report create error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

// GET /api/reports?status=pending — admin sees all; store owners see their store's
export async function GET(request: NextRequest) {
  try {
    const authSupabase = await createClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = request.nextUrl.searchParams.get("status") || "pending";
    const isAdmin = ADMIN_IDS.includes(user.id);
    const db = isAdmin ? adminClient() : authSupabase;

    let query = db
      .from("product_reports")
      .select("*, products(id, name, image_url, store_id), stores(name, slug)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!isAdmin) {
      const { data: store } = await authSupabase
        .from("stores")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!store) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      query = query.eq("store_id", store.id);
    }

    if (status !== "all") {
      if (status.includes(",")) query = query.in("status", status.split(",").map((s) => s.trim()).filter(Boolean));
      else query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Report list error:", error);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}

// PATCH /api/reports — { id, status: "reviewed" | "dismissed", hideProduct? }
export async function PATCH(request: NextRequest) {
  try {
    const authSupabase = await createClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status, hideProduct } = await request.json();
    if (!id || !["reviewed", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
    }

    const isAdmin = ADMIN_IDS.includes(user.id);
    const db = isAdmin ? adminClient() : authSupabase;

    // Fetch report with store owner for permission check
    const { data: report } = await db
      .from("product_reports")
      .select("id, product_id, stores(user_id)")
      .eq("id", id)
      .single();
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const storeData = Array.isArray(report.stores) ? report.stores[0] : report.stores;
    const isStoreOwner = storeData && storeData.user_id === user.id;
    if (!isAdmin && !isStoreOwner) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error } = await db
      .from("product_reports")
      .update({ status, resolved_at: new Date().toISOString(), resolved_by: user.id })
      .eq("id", id);
    if (error) throw error;

    if (hideProduct) {
      await db.from("products").update({ in_stock: false }).eq("id", report.product_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Report update error:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
