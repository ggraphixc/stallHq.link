import { NextRequest, NextResponse } from "next/server";
import { createClient as createTokenClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/api";
import {
  adminClient,
  getAiSettings,
  resolveProvider,
  callAiProvider,
} from "@/lib/ai";

export const maxDuration = 300;

/**
 * POST /api/ai/bulk-descriptions
 * Body: { productIds: string[] }
 * Generates descriptions for products without one (or all requested). One AI
 * call per product with per-product error capture, so a partial failure never
 * kills the whole batch.
 */
export async function POST(req: NextRequest) {
  try {
    const { productIds, force } = await req.json();
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "productIds array is required" }, { status: 400 });
    }
    if (productIds.length > 100) {
      return NextResponse.json({ error: "Max 100 products per batch" }, { status: 400 });
    }

    // Auth
    const accessToken = req.headers.get("x-access-token");
    let user: { id: string } | null = null;
    if (accessToken) {
      const tokenClient = createTokenClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      );
      const { data } = await tokenClient.auth.getUser();
      user = data.user;
    } else {
      const cookieClient = await createAuthClient();
      const { data } = await cookieClient.auth.getUser();
      user = data.user;
    }
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminSupabase = adminClient();

    // Ownership: the user must own the store these products belong to
    const { data: store } = await adminSupabase
      .from("stores")
      .select("id, plan")
      .eq("user_id", user.id)
      .single();
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
    if (store.plan === "trial") {
      return NextResponse.json(
        { error: "AI features require a paid plan", upgradeRequired: true },
        { status: 403 }
      );
    }

    const { data: products, error: productError } = await adminSupabase
      .from("products")
      .select("id, name, description, price, category, image_url")
      .eq("store_id", store.id)
      .in("id", productIds);
    if (productError) throw productError;

    const toGenerate = (products || []).filter(
      (p: any) => force || !p.description || !p.description.trim()
    );
    if (toGenerate.length === 0) {
      return NextResponse.json({
        message: "All selected products already have descriptions.",
        results: [],
        skipped: (products || []).length,
      });
    }

    // Provider setup (single resolve; one shared config for the batch)
    let config;
    try {
      const settings = await getAiSettings();
      config = resolveProvider(settings);
    } catch (e: any) {
      const msg = String(e?.message || "");
      const map: Record<string, string> = {
        AI_FEATURES_DISABLED: "AI features are not enabled by the platform admin",
        AI_NOT_CONFIGURED_KEY: "AI not configured — no API key set",
        AI_NOT_CONFIGURED_MODEL: "AI not configured — no model set",
        AI_NO_BASE_URL: "No AI base URL configured. Check admin settings.",
      };
      return NextResponse.json({ error: map[msg] || "AI is not configured" }, { status: 400 });
    }

    const system =
      "You are an expert copywriter for Nigerian online stores. Write compelling, detailed product descriptions that sell. 4-6 sentences, opening with a hook, highlighting key features and benefits, warm professional Nigerian-market language, ending with a subtle call-to-action. Never include prefixes like 'DESCRIPTION:' — just write the description.";

    const results: Array<{
      id: string;
      name: string;
      success: boolean;
      description?: string;
      error?: string;
    }> = [];

    for (const p of toGenerate) {
      try {
        const promptText = `Write a product description for:\nProduct Name: ${p.name}\nCategory: ${p.category || "General"}\nPrice: ₦${Number(p.price).toLocaleString()}\n\nOnly return the description text, nothing else.`;
        const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
          { type: "text", text: promptText },
        ];
        if (p.image_url && p.image_url.length < 1_500_000) {
          contentParts.push({ type: "image_url", image_url: { url: p.image_url } });
        }

        let text = await callAiProvider(config, [
          { role: "system", content: system },
          {
            role: "user",
            content: contentParts.length === 1 ? (contentParts[0].text as string) : contentParts,
          },
        ], 500);
        text = text.replace(/^DESCRIPTION:\s*/i, "").trim();
        if (text.length > 1500) text = text.slice(0, 1497) + "...";

        const { error: updateError } = await adminSupabase
          .from("products")
          .update({ description: text, updated_at: new Date().toISOString() })
          .eq("id", p.id);
        if (updateError) throw updateError;

        results.push({ id: p.id, name: p.name, success: true, description: text });
      } catch (err: any) {
        results.push({ id: p.id, name: p.name, success: false, error: err?.message || "Generation failed" });
      }
    }

    return NextResponse.json({
      processed: results.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error: any) {
    if (error?.status) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Bulk AI error:", error?.message || error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
