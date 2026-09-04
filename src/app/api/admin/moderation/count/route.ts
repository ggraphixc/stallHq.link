import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { adminClient } from "@/lib/ai";

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "").split(",").map((s) => s.trim()).filter(Boolean);

// GET /api/admin/moderation/count — pending moderation totals for the sidebar badge
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !ADMIN_IDS.includes(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = adminClient();
    const [flags, productReports, reviewReports] = await Promise.all([
      db.from("moderation_flags").select("id", { count: "exact", head: true }).eq("status", "pending"),
      db.from("product_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      db.from("review_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    const counts = {
      flags: flags.count ?? 0,
      productReports: productReports.count ?? 0,
      reviewReports: reviewReports.count ?? 0,
      total: (flags.count ?? 0) + (productReports.count ?? 0) + (reviewReports.count ?? 0),
    };

    return NextResponse.json(counts);
  } catch (error: any) {
    console.error("Moderation count error:", error?.message || error);
    return NextResponse.json({ error: "Failed to load counts" }, { status: 500 });
  }
}
