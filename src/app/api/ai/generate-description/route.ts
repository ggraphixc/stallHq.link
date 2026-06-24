import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Provider base URLs
const PROVIDER_URLS: Record<string, string> = {
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  opencodezen: "", // configured via ai_base_url setting
  openai: "https://api.openai.com/v1/chat/completions",
  custom: "", // configured via ai_base_url setting
};

export async function POST(req: NextRequest) {
  try {
    const { name, category, price, imageUrl } = await req.json();

    if (!name) {
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
      return NextResponse.json({ error: "AI features are not enabled" }, { status: 400 });
    }
    if (!settings.ai_api_key || !settings.ai_model) {
      return NextResponse.json({ error: "AI provider not configured" }, { status: 400 });
    }

    const provider = settings.ai_provider || "openrouter";
    const model = settings.ai_model;
    const apiKey = settings.ai_api_key;

    // Determine base URL
    let baseURL = settings.ai_base_url || PROVIDER_URLS[provider] || "";
    if (!baseURL) {
      return NextResponse.json({ error: "No base URL configured for this provider" }, { status: 400 });
    }

    // Build messages for multimodal support
    const systemMessage = {
      role: "system",
      content: "You are a product copywriter for a Nigerian online store. Generate compelling, concise product descriptions. Use persuasive, sales-oriented language appropriate for a Nigerian audience. Mention Naira pricing if relevant. Be professional but friendly.",
    };

    // Build user message content (text + optional image)
    const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    let promptText = `Generate a 2-3 sentence product description for:

Product Name: ${name}`;
    if (category) promptText += `\nCategory: ${category}`;
    if (price) promptText += `\nPrice: ₦${price}`;
    promptText += `\n\nHighlight key features and benefits. Focus on what makes this product valuable. Only return the description text, nothing else.`;

    contentParts.push({ type: "text", text: promptText });

    // Add image if provided (multimodal)
    if (imageUrl && (imageUrl.startsWith("data:image") || imageUrl.startsWith("http"))) {
      const imageContent = imageUrl.startsWith("data:")
        ? imageUrl // already base64 data URL
        : imageUrl; // HTTP URL

      contentParts.push({
        type: "image_url",
        image_url: { url: imageContent },
      });
    }

    const userMessage = {
      role: "user",
      content: contentParts.length === 1 ? contentParts[0].text : contentParts,
    };

    // Call the AI provider
    const response = await fetch(baseURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(provider === "openrouter" ? { "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app" } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [systemMessage, userMessage],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI provider error:", response.status, errorText);
      return NextResponse.json(
        { error: "AI provider request failed" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim();

    if (!description) {
      return NextResponse.json({ error: "No description generated" }, { status: 500 });
    }

    // Suggest category if not provided
    let suggestedCategory = null;
    if (!category) {
      try {
        const catResponse = await fetch(baseURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            ...(provider === "openrouter" ? { "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app" } : {}),
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "Return only a single category name, nothing else." },
              { role: "user", content: `Based on this product name "${name}", suggest ONE short category name (e.g., "Electronics", "Fashion", "Beauty", "Food", "Home & Garden"). Return ONLY the category name.` },
            ],
            max_tokens: 20,
          }),
        });
        if (catResponse.ok) {
          const catData = await catResponse.json();
          suggestedCategory = catData.choices?.[0]?.message?.content?.trim() || null;
        }
      } catch {
        // Category suggestion is optional, ignore errors
      }
    }

    return NextResponse.json({ description, suggestedCategory });
  } catch (error: any) {
    console.error("AI generation error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    );
  }
}