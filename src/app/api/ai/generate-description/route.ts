import { NextRequest, NextResponse } from "next/server";
import { createClient as createTokenClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/api";
import {
  adminClient,
  getAiSettings,
  resolveProvider,
  callAiProvider,
  checkRateLimit,
  getRateLimitReset,
} from "@/lib/ai";

/**
 * POST /api/ai/generate-description
 * Single product description generation. Auth via session cookie (web) or
 * `x-access-token` header (mobile app).
 */
export async function POST(req: NextRequest) {
  try {
    const { name, category, price, imageUrl } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    // ── Auth: cookie session (web) OR x-access-token (mobile) ──
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

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limit ──
    if (!checkRateLimit(user.id)) {
      const reset = getRateLimitReset(user.id);
      return NextResponse.json(
        { error: `Too many requests. Try again in ~${Math.ceil((reset || 60) / 60)} min.` },
        { status: 429 }
      );
    }

    // ── Plan gate — AI only for paid plans ──
    const adminSupabase = adminClient();
    const { data: store } = await adminSupabase
      .from("stores")
      .select("plan")
      .eq("user_id", user.id)
      .single();
    if (!store || store.plan === "trial") {
      return NextResponse.json(
        { error: "AI features require a paid plan", upgradeRequired: true },
        { status: 403 }
      );
    }

    // ── Settings + provider ──
    const settings = await getAiSettings();
    const config = resolveProvider(settings); // throws descriptive errors

    // Build prompt
    let promptText = `You are a professional copywriter for a Nigerian online store. Write a compelling, detailed product description (4-6 sentences) for:\n\nProduct Name: ${name.trim()}`;
    if (category) promptText += `\nCategory: ${category.trim()}`;
    if (price) promptText += `\nPrice: ₦${price}`;
    promptText += `\n\nWrite a persuasive, sales-oriented description that:
- Opens with an attention-grabbing hook
- Highlights 2-3 key features and their benefits
- Creates urgency or desire
- Uses warm, professional language suitable for Nigerian customers
- Flows naturally with good sentence construction
- Ends with a subtle call-to-action feel

Do NOT include any prefixes like "DESCRIPTION:" — just write the description directly.`;

    if (!category) {
      promptText += `\n\nAlso suggest ONE short category name (e.g., "Electronics", "Fashion", "Beauty", "Food").`;
      promptText += `\nReturn your response in this exact format:\nDESCRIPTION: <the 4-6 sentence description>\nCATEGORY: <the category>`;
    } else {
      promptText += `\n\nOnly return the description text, nothing else.`;
    }

    // Message content (text + optional image for multimodal)
    const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    contentParts.push({ type: "text", text: promptText });
    if (imageUrl && imageUrl.length < 1_500_000) {
      contentParts.push({ type: "image_url", image_url: { url: imageUrl } });
    }

    const system =
      "You are an expert copywriter for Nigerian online stores. You write compelling, detailed product descriptions that sell. Your descriptions are 4-6 sentences, opening with a hook, highlighting key features and benefits, and ending with a subtle call-to-action. You use warm, professional language. Never include prefixes like 'DESCRIPTION:' — just write the description.";

    const content = await callAiProvider(config, [
      { role: "system", content: system },
      {
        role: "user",
        content: contentParts.length === 1 ? (contentParts[0].text as string) : contentParts,
      },
    ]);

    // Parse
    let description: string;
    let suggestedCategory: string | null = null;

    if (!category && content.includes("DESCRIPTION:") && content.includes("CATEGORY:")) {
      const descStart = content.indexOf("DESCRIPTION:") + "DESCRIPTION:".length;
      const catStart = content.indexOf("CATEGORY:");
      description = content.slice(descStart, catStart).trim();
      suggestedCategory = content.slice(catStart + "CATEGORY:".length).trim() || null;
    } else {
      description = content;
    }

    description = description.replace(/^DESCRIPTION:\s*/i, "").trim();
    suggestedCategory = suggestedCategory?.replace(/^CATEGORY:\s*/i, "").trim() || null;

    if (description.length > 1500) {
      description = description.slice(0, 1497) + "...";
    }

    return NextResponse.json({ description, suggestedCategory });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const msg = String(error?.message || "");
    if (msg === "AI_FEATURES_DISABLED") {
      return NextResponse.json({ error: "AI features are not enabled by the platform admin" }, { status: 400 });
    }
    if (msg === "AI_NOT_CONFIGURED_KEY") {
      return NextResponse.json({ error: "AI not configured — no API key set" }, { status: 400 });
    }
    if (msg === "AI_NOT_CONFIGURED_MODEL") {
      return NextResponse.json({ error: "AI not configured — no model set" }, { status: 400 });
    }
    if (msg === "AI_NO_BASE_URL") {
      return NextResponse.json({ error: "No AI base URL configured. Check admin settings." }, { status: 400 });
    }
    console.error("AI generation error:", error?.message || error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
