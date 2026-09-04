import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendModerationDigestEmail, type DigestItem } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3.6e6);
  if (h < 1) return "now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// GET /api/cron/moderation-digest — daily admin summary of pending moderation
export async function GET(request: NextRequest) {
  // Verify cron secret — accept Bearer token OR Vercel's x-vercel-cron header
  const authHeader = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !vercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = { flagCount: 0, productReportCount: 0, reviewReportCount: 0, emailed: 0, errors: 0, skipped: false, timestamp: new Date().toISOString() };

  // ── Pending AI flags ──────────────────────────────────────────────────────
  const [{ count: flagCount }, { data: recentFlags }] = await Promise.all([
    supabase.from("moderation_flags").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("moderation_flags")
      .select("product_name, reason, severity, created_at, stores(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  result.flagCount = flagCount || 0;

  // ── Pending product reports ───────────────────────────────────────────────
  const [{ count: prodCount }, { data: recentProds }] = await Promise.all([
    supabase.from("product_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("product_reports")
      .select("reason, details, created_at, products(name), stores(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  result.productReportCount = prodCount || 0;

  // ── Pending review reports ────────────────────────────────────────────────
  const [{ count: revCount }, { data: recentRevReports }] = await Promise.all([
    supabase.from("review_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("review_reports")
      .select("reason, details, created_at, reviews(reviewer_name, rating, comment), stores(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  result.reviewReportCount = revCount || 0;

  const total = result.flagCount + result.productReportCount + result.reviewReportCount;

  // Nothing to do — skip the email entirely
  if (total === 0) {
    result.skipped = true;
    return NextResponse.json({ success: true, ...result });
  }

  const flags: DigestItem[] = (recentFlags || []).map((f: any) => ({
    label: f.product_name || "Unknown product",
    meta: `AI ${f.severity || "flag"} · ${f.reason || ""}${f.stores?.name ? ` · ${f.stores.name}` : ""}`,
    age: timeAgo(f.created_at),
  }));

  const productReports: DigestItem[] = (recentProds || []).map((r: any) => ({
    label: (r.products && (r.products as any).name) || "Unknown product",
    meta: `${r.reason || ""}${r.stores?.name ? ` · ${(r.stores as any).name}` : ""}`,
    age: timeAgo(r.created_at),
  }));

  const reviewReports: DigestItem[] = (recentRevReports || []).map((r: any) => {
    const review = r.reviews && !Array.isArray(r.reviews) ? r.reviews : null;
    return {
      label: `Review by ${review?.reviewer_name || "customer"}${review?.rating ? ` · ${review.rating}/5` : ""}`,
      meta: `${r.reason || ""}${(r.stores as any)?.name ? ` · ${(r.stores as any).name}` : ""}`,
      age: timeAgo(r.created_at),
    };
  });

  // ── Resolve admin recipients ──────────────────────────────────────────────
  const recipients = new Set<string>();
  if (process.env.ADMIN_EMAIL) recipients.add(process.env.ADMIN_EMAIL.trim());

  for (const uid of ADMIN_IDS) {
    try {
      const { data } = await supabase.auth.admin.getUserById(uid);
      if (data?.user?.email) recipients.add(data.user.email);
    } catch {
      result.errors++;
    }
  }

  if (recipients.size === 0) {
    result.skipped = true;
    console.warn("[ModerationDigest] No admin recipients configured (ADMIN_USER_ID / ADMIN_EMAIL). Skipping email.");
    return NextResponse.json({ success: true, ...result });
  }

  for (const email of recipients) {
    try {
      await sendModerationDigestEmail({
        email,
        flagCount: result.flagCount,
        productReportCount: result.productReportCount,
        reviewReportCount: result.reviewReportCount,
        flags,
        productReports,
        reviewReports,
      });
      result.emailed++;
    } catch {
      result.errors++;
    }
  }

  return NextResponse.json({ success: true, ...result });
}
