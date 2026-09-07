import { NextRequest, NextResponse } from "next/server";
import { getAiSettings, resolveProvider, callAiProvider } from "@/lib/ai";

/**
 * AI content generator for push notifications.
 * Uses the platform-configured LLM (OpenRouter / OpenAI / Google Gemini / custom)
 * to generate context-aware push notification titles and bodies.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, type = "content", audience = "all" } = body as {
      prompt?: string;
      type?: string;
      audience?: string;
    };

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const settings = await getAiSettings();
    const config = resolveProvider(settings);

    const typeLabel: Record<string, string> = {
      content: "daily content tip",
      promo: "promo or announcement",
      motivation: "motivation or business tip",
      business: "business idea or market news",
    };

    const audienceLabel: Record<string, string> = {
      all: "all users (vendors and customers)",
      customers: "customers browsing the marketplace",
      vendors: "vendors running their stores",
      trial: "vendors on a free trial",
      paid: "vendors on a paid subscription plan",
    };

    const systemPrompt = `You are a copywriter for stallHq, a Nigerian digital storefront marketplace for small businesses. You write short, punchy push notifications that feel friendly, local, and actionable. Nigerian context: WhatsApp is the primary ordering channel, prices are in Naira (₦), data is expensive so messages must be concise.`;

    const userPrompt = `${prompt}

Context:
- Notification type: ${typeLabel[type] || type}
- Target audience: ${audienceLabel[audience] || audience}
- Title must be under 50 characters, catchy and specific
- Body must be under 120 characters, actionable and friendly
- Use emoji sparingly (1 max)
- Do NOT use generic filler — be specific to the type and audience
- Output valid JSON only: { "title": "...", "body": "..." }`;

    const content = await callAiProvider(config, [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], 300);

    // Parse the JSON response from the LLM
    let title = "";
    let msgBody = "";

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        title = parsed.title || "";
        msgBody = parsed.body || parsed.message || "";
      }
    } catch {
      const lines = content.split("\n").filter(Boolean);
      title = lines[0]?.replace(/^["']|["']$/g, "") || "";
      msgBody = lines.slice(1).join(" ").replace(/^["']|["']$/g, "") || content;
    }

    if (title.length > 60) title = title.slice(0, 57) + "…";
    if (msgBody.length > 160) msgBody = msgBody.slice(0, 157) + "…";
    if (!title || !msgBody) {
      return NextResponse.json({ error: "AI returned empty content. Check your model and API key." }, { status: 502 });
    }

    return NextResponse.json({ title, body: msgBody }, { status: 200 });
  } catch (error: any) {
    const msg = error?.message || "AI generation failed";
    const status = error?.status || 500;

    if (msg === "AI_FEATURES_DISABLED") {
      return NextResponse.json({ error: "AI features are disabled. Enable them in Admin → Settings → AI." }, { status: 400 });
    }
    if (msg === "AI_NOT_CONFIGURED_KEY" || msg === "AI_NOT_CONFIGURED_MODEL" || msg === "AI_NO_BASE_URL") {
      return NextResponse.json({ error: "AI not configured. Set your API key and model in Admin → Settings → AI." }, { status: 400 });
    }

    console.error("AI push generation failed:", error);
    return NextResponse.json({ error: msg }, { status });
  }
}
