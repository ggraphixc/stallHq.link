import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { adminClient, getAiSettings, resolveProvider, callAiProvider } from "@/lib/ai";

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "").split(",").map((s) => s.trim()).filter(Boolean);

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_IDS.includes(user.id)) return null;
  return user;
}

/**
 * Rule-based signals — always run (no AI cost). Catches obvious abuse cheaply.
 */
const RULE_SIGNALS: Array<{ pattern: RegExp; reason: string; severity: "low" | "medium" | "high" }> = [
  { pattern: /\b(weed|cannabis|marijuana|hemp|drugs|cocaine|crack|meth|tramadol|codeine)\b/i, reason: "Possible drug/supplement listing", severity: "high" },
  { pattern: /\b(pistol|gun|rifle|ammo|ammunition|bullet|weapon|knife|machete|pepper spray)\b/i, reason: "Possible weapon listing", severity: "high" },
  { pattern: /\b(counterfeit|fake rolex|replica|knockoff|dup(licate)? of|1:1 copy|clone of)\b/i, reason: "Possible counterfeit goods", severity: "high" },
  { pattern: /\b(herbal viagra|penis enlargement|breast enlargement|testosterone boost|magic ring|money ritual)\b/i, reason: "Prohibited health/ritual claim", severity: "high" },
  { pattern: /\b(bitcoin doubler|get rich quick|instant million|guaranteed profit|forex signals)\b/i, reason: "Possible scam/financial scheme", severity: "high" },
  { pattern: /\b(original [a-z]+ watch|genuine iphone|authentic nike)\b/i, reason: "Brand claim — verify authenticity", severity: "low" },
];

/**
 * POST /api/admin/moderation/scan
 * Body: { useAI?: boolean, limit?: number }
 * Scans recent products; inserts moderation_flags for suspicious ones.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { useAI, limit } = await req.json();
    const useAiReview = useAI === true;
    const scanLimit = Math.min(Number(limit) || 200, 1000);

    const supabase = adminClient();
    const { data: products } = await supabase
      .from("products")
      .select("id, name, description, category, store_id, created_at")
      .order("created_at", { ascending: false })
      .limit(scanLimit);

    if (!products || products.length === 0) {
      return NextResponse.json({ scanned: 0, flagged: 0, flags: [] });
    }

    const flags: Array<{
      store_id: string;
      product_id: string;
      product_name: string;
      reason: string;
      severity: "low" | "medium" | "high";
      ai_reviewed: boolean;
    }> = [];

    for (const p of products) {
      const text = `${p.name} ${p.description || ""} ${p.category || ""}`;
      const hits = RULE_SIGNALS.filter((s) => s.pattern.test(text));

      // If no rule hit, optionally run the AI reviewer for suspicious patterns
      if (hits.length === 0 && useAiReview && (p.description?.length || 0) > 40) {
        try {
          const settings = await getAiSettings();
          const config = resolveProvider(settings);
          const prompt =
            `You are a marketplace content moderator. Review this product listing for a Nigerian online store platform.\n` +
            `Product: "${p.name}"\nCategory: ${p.category || "n/a"}\nDescription: "${(p.description || "").slice(0, 600)}"\n\n` +
            `Flag if it contains: banned/regulated goods (drugs, weapons, counterfeit brand items), scam or get-rich-quick schemes, dangerous health claims, or other policy violations.\n` +
            `Reply with exactly one word: FLAG or OK. If flagging, add a second line with a short reason (max 12 words).`;
          const content = await callAiProvider(config, [
            { role: "system", content: "You are a strict but fair marketplace moderator. Reply exactly 'FLAG'/'OK' plus optional short reason." },
            { role: "user", content: prompt },
          ], 100);
          const firstLine = content.split("\n")[0].trim().toUpperCase();
          if (firstLine === "FLAG") {
            const reason = content.split("\n").slice(1).join(" ").trim().slice(0, 140) || "Flagged by AI review";
            flags.push({ store_id: p.store_id, product_id: p.id, product_name: p.name, reason, severity: "medium", ai_reviewed: true });
          }
        } catch {
          // AI unavailable/cost — skip silently; rule scan already done
        }
      } else if (hits.length > 0) {
        const worst = hits.reduce((a, b) => (severityRank(b.severity) > severityRank(a.severity) ? b : a));
        flags.push({
          store_id: p.store_id,
          product_id: p.id,
          product_name: p.name,
          reason: hits.map((h) => h.reason).slice(0, 2).join("; "),
          severity: worst.severity,
          ai_reviewed: false,
        });
      }
    }

    // Upsert flags (one per product — new flags overwrite previous)
    let inserted = 0;
    if (flags.length > 0) {
      const { error } = await supabase
        .from("moderation_flags")
        .upsert(flags, { onConflict: "product_id" });
      if (error) throw error;
      inserted = flags.length;
    }

    return NextResponse.json({
      scanned: products.length,
      flagged: inserted,
      flags: flags.map((f) => ({ product_id: f.product_id, product_name: f.product_name, reason: f.reason, severity: f.severity })),
    });
  } catch (error: any) {
    console.error("Moderation scan error:", error?.message || error);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}

function severityRank(s: string): number {
  return s === "high" ? 2 : s === "medium" ? 1 : 0;
}
