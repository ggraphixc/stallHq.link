import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Provider base URLs
const PROVIDER_URLS: Record<string, string> = {
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  opencodezen: "",
  openai: "https://api.openai.com/v1/chat/completions",
  custom: "",
};

// Simple in-memory rate limit: 10 requests per user per 5 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, category, price, imageUrl } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    // Auth check
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => req.cookies.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    // Plan check — AI is only for paid plans
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
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

    // Load AI settings from platform_settings
    const { data: settingsRows } = await adminSupabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["ai_enabled", "ai_provider", "ai_model", "ai_api_key", "ai_base_url"]);

    const settings: Record<string, any> = {};
    settingsRows?.forEach((r) => { settings[r.key] = r.value; });

    if (!settings.ai_enabled) {
      return NextResponse.json({ error: "AI features are not enabled by the platform admin" }, { status: 400 });
    }
    if (!settings.ai_api_key) {
      return NextResponse.json({ error: "AI not configured — no API key set" }, { status: 400 });
    }
    if (!settings.ai_model) {
      return NextResponse.json({ error: "AI not configured — no model set" }, { status: 400 });
    }

    const provider = settings.ai_provider || "openrouter";
    const model = settings.ai_model;
    const apiKey = settings.ai_api_key;

    // Determine base URL — append /chat/completions if not already present
    let baseURL = settings.ai_base_url || PROVIDER_URLS[provider] || "";
    if (!baseURL) {
      return NextResponse.json({ error: `No base URL configured for ${provider}` }, { status: 400 });
    }
    if (!baseURL.endsWith("/chat/completions")) {
      baseURL = baseURL.replace(/\/+$/, "") + "/chat/completions";
    }

    // Build prompt — single call for description + category
    let promptText = `Generate a 2-3 sentence product description for:

Product Name: ${name.trim()}`;
    if (category) promptText += `\nCategory: ${category.trim()}`;
    if (price) promptText += `\nPrice: ₦${price}`;
    promptText += `\n\nHighlight key features and benefits. Focus on what makes this product valuable.`;

    if (!category) {
      promptText += `\n\nAlso suggest ONE short category name (e.g., "Electronics", "Fashion", "Beauty", "Food").`;
      promptText += `\nReturn your response in this exact format:
DESCRIPTION: <the description>
CATEGORY: <the category>`;
    } else {
      promptText += `\n\nOnly return the description text, nothing else.`;
    }

    // Build message content (text + optional image)
    const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    contentParts.push({ type: "text", text: promptText });

    // Send product image for multimodal AI (base64 data URL or HTTP URL)
    // Skip if image is too large (>1MB base64 text)
    if (imageUrl && imageUrl.length < 1_500_000) {
      contentParts.push({
        type: "image_url",
        image_url: { url: imageUrl },
      });
    }

    const userMessage = {
      role: "user",
      content: contentParts.length === 1 ? contentParts[0].text : contentParts,
    };

    // Call the AI provider with timeout
    let response: Response;
    try {
      response = await fetchWithTimeout(baseURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...(provider === "openrouter" ? {
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app",
            "X-Title": "stallHq",
          } : {}),
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are a product copywriter for a Nigerian online store. Generate compelling, concise product descriptions. Use persuasive, sales-oriented language appropriate for a Nigerian audience. Mention Naira pricing if relevant. Be professional but friendly." },
            userMessage,
          ],
          max_tokens: 200,
        }),
      }, 30000);
    } catch (fetchError: any) {
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "AI request timed out. The service may be slow — try again." },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: "Could not connect to AI provider. Check your network." },
        { status: 502 }
      );
    }

    // Handle provider errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown");
      console.error("AI provider error:", response.status, errorText.slice(0, 200));

      if (response.status === 429) {
        return NextResponse.json(
          { error: "AI provider rate limit hit. Try again in a minute." },
          { status: 429 }
        );
      }
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: "Invalid AI API key. Check your settings." },
          { status: 401 }
        );
      }
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Model "${model}" not found. Check your model name.` },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "AI provider error. Try again later." },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Debug: log raw response structure (first 500 chars)
    console.log("AI raw response keys:", Object.keys(data).join(", "));
    console.log("AI raw response snippet:", JSON.stringify(data).slice(0, 500));

    // Try multiple response formats
    let content = data.choices?.[0]?.message?.content?.trim();
    if (!content) content = data.choices?.[0]?.text?.trim();
    if (!content) content = data.output?.text?.trim();
    if (!content) content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("AI empty response. Full data:", JSON.stringify(data).slice(0, 1000));
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }

    // Parse response
    let description: string;
    let suggestedCategory: string | null = null;

    if (!category && content.includes("DESCRIPTION:") && content.includes("CATEGORY:")) {
      // Parse structured response: "DESCRIPTION: ...\nCATEGORY: ..."
      const descStart = content.indexOf("DESCRIPTION:") + "DESCRIPTION:".length;
      const catStart = content.indexOf("CATEGORY:");
      description = content.slice(descStart, catStart).trim();
      suggestedCategory = content.slice(catStart + "CATEGORY:".length).trim() || null;
    } else {
      description = content;
    }

    // Trim to reasonable length (max ~500 chars for product descriptions)
    if (description.length > 500) {
      description = description.slice(0, 497) + "...";
    }

    return NextResponse.json({ description, suggestedCategory });
  } catch (error: any) {
    console.error("AI generation error:", error?.message || error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}