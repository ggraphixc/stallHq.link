import { NextRequest, NextResponse } from "next/server";
import {
  adminClient,
  getAiSettings,
  resolveProvider,
  callAiProvider,
  buildCatalogPrompt,
} from "@/lib/ai";

export const maxDuration = 60;

/**
 * POST /api/ai/assistant
 * Body: { storeSlug, message, history?: [{role, content}] }
 *
 * Public storefront assistant: grounded in the store's real product catalog.
 * Guards: store must be active, assistant toggle must be on, IP rate limit.
 */
const ipLimits = new Map<string, { count: number; resetAt: number }>();

function ipLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipLimits.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return false;
  }
  if (entry.count >= 15) return true; // 15 msgs / min / IP
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { storeSlug, message, history } = await req.json();
    if (!storeSlug || typeof storeSlug !== "string") {
      return NextResponse.json({ error: "storeSlug is required" }, { status: 400 });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Basic per-IP throttle
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (ipLimited(ip)) {
      return NextResponse.json(
        { error: "You're sending messages too quickly. Slow down a moment." },
        { status: 429 }
      );
    }

    const supabase = adminClient();

    // Store + products
    const { data: store } = await supabase
      .from("stores")
      .select("id, name, slug, description, whatsapp_number, setup_complete")
      .eq("slug", storeSlug)
      .single();

    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const { data: products } = await supabase
      .from("products")
      .select("name, price, category, description, in_stock")
      .eq("store_id", store.id)
      .order("created_at", { ascending: true });

    // Settings + toggle
    const settings = await getAiSettings();
    const assistantEnabled =
      settings.ai_assistant_enabled === true || settings.ai_assistant_enabled === "true";
    if (settings.ai_enabled !== true && settings.ai_enabled !== "true") {
      return NextResponse.json({ error: "AI features are not enabled" }, { status: 400 });
    }
    if (!assistantEnabled) {
      return NextResponse.json({ error: "AI assistant is not enabled for stores" }, { status: 400 });
    }
    let config;
    try {
      config = resolveProvider(settings);
    } catch {
      return NextResponse.json({ error: "AI assistant is not configured yet" }, { status: 400 });
    }

    const catalog = buildCatalogPrompt((products || []) as any);
    const waNumber = store.whatsapp_number ? String(store.whatsapp_number).replace(/[^0-9]/g, "") : null;

    const system = [
      `You are ${store.name}'s helpful store assistant on stallHq.`,
      "Your ONLY source of truth is the product catalog below. Never invent products, prices, stock, or discounts that are not listed.",
      `Catalog:\n${catalog}`,
      "- Answer in a warm, friendly, Nigerian-market tone, keep replies short and scannable.",
      "- If asked about something not in the catalog, say it isn't available and mention what IS available.",
      "- Prices are in Nigerian Naira (₦).",
      waNumber
        ? `- To place an order, tell the customer to tap the WhatsApp button — the vendor handles checkout on WhatsApp (+${waNumber}). Never collect personal data or payments yourself.`
        : "- This store currently has no WhatsApp number configured — direct customers to browse the catalog.",
      "- Do NOT discuss topics unrelated to this store or its products.",
    ].join("\n");

    // Trim history to last 8 turns to keep the request small
    const trimmedHistory = Array.isArray(history)
      ? history.slice(-8).map((h: any) => ({ role: h.role === "assistant" ? "assistant" : "user", content: String(h.content || "").slice(0, 500) }))
      : [];

    let reply: string;
    try {
      reply = await callAiProvider(config, [
        { role: "system", content: system },
        ...trimmedHistory,
        { role: "user", content: message.slice(0, 1000) },
      ], 400);
    } catch (err: any) {
      if (err?.status) return NextResponse.json({ error: err.message }, { status: err.status });
      throw err;
    }

    return NextResponse.json({ reply: reply.slice(0, 2000) });
  } catch (error: any) {
    if (error?.status) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Assistant error:", error?.message || error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
