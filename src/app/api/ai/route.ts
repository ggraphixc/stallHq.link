import { NextRequest, NextResponse } from "next/server";
import { getAiSettings, resolveProvider, callAiProvider } from "@/lib/ai";

/**
 * AI content generator for push notifications.
 * Tries the platform-configured LLM first. If the LLM fails
 * (misconfigured, provider error, etc.), falls back to a built-in
 * heuristic generator so the admin always gets usable content.
 */

// ─── Heuristic fallback corpus ──────────────────────────────────────────────
const TIPS: Record<string, string[]> = {
  all: [
    "Feature your bestseller on the store homepage.",
    "Send a message to your WhatsApp list before restocking.",
    "Add product photos — stores with images get more orders.",
    "Bundle two related products at a small discount.",
    "Reply to every review — buyers notice.",
    "Share your stallHq.link in your WhatsApp status today.",
  ],
  customers: [
    "Explore new stores on stallHq.link every day.",
    "Save your favorite stores for faster access.",
    "Check back often — new products pop up daily.",
    "Leave a review after a great purchase.",
  ],
  vendors: [
    "Add at least 5 products — more products means more discovery.",
    "Set your WhatsApp number so orders reach you fast.",
    "Attach a clear photo to every product.",
    "Turn on low-stock alerts so you never oversell.",
    "Reply to new reviews within 24 hours.",
  ],
  trial: [
    "Your 14-day trial is ticking — add products now.",
    "You can publish your store in under 5 minutes.",
    "Set your WhatsApp number to receive orders.",
    "A store with 3+ products looks more trustworthy.",
  ],
  paid: [
    "Keep your store polished — review bestsellers.",
    "Add a new product this week to stay fresh.",
    "Use promo cards to highlight seasonal deals.",
    "Ask happy buyers to leave a review.",
  ],
};

const TYPE_TEMPLATES: Record<string, string[]> = {
  content: ["💡 {tip}", "Quick tip: {tip}", "Try this today: {tip}"],
  promo: ["🎉 {offer}", "New offer: {offer}", "Don't miss this: {offer}"],
  motivation: ["{tip}", "Pro tip: {tip}", "Tip of the day: {tip}"],
  business: ["📈 {insight}", "Business idea: {insight}", "Trend watch: {insight}"],
};

const OFFERS = [
  "Up to {discount}% off selected items this week.",
  "Bundle 2 items and save {discount}%.",
  "New arrivals just dropped — tap to browse.",
  "Limited stock — grab yours now.",
  "Buy 2 get 1 free on select items.",
];

const INSIGHTS = [
  "Stores with 5+ photos get more orders.",
  "WhatsApp vendors do best when they reply within an hour.",
  "Weekend traffic is 2x weekday traffic.",
  "Promo messages sent before 10am get the most taps.",
  "A thank-you message after order boosts repeat purchases.",
];

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function generateHeuristic(type: string, audience: string): { title: string; body: string } {
  const templates = TYPE_TEMPLATES[type] || TYPE_TEMPLATES.content;
  const tips = TIPS[audience] || TIPS.all;

  let msg = pick(templates);
  msg = msg.replace("{tip}", pick(tips));
  msg = msg.replace("{offer}", pick(OFFERS)
    .replace("{discount}", String(Math.floor(Math.random() * 20 + 10)))
    .replace("{product}", pick(["your bestseller", "the new arrival", "favourite item"])));
  msg = msg.replace("{insight}", pick(INSIGHTS));

  const title = msg.length > 50 ? msg.slice(0, 47) + "…" : msg;
  return { title, body: msg };
}

// ─── Main handler ───────────────────────────────────────────────────────────

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

    // Try the real LLM first
    try {
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
      if (!title || !msgBody) throw new Error("empty");

      return NextResponse.json({ title, body: msgBody }, { status: 200 });
    } catch (llmError: any) {
      // LLM failed — log and fall through to heuristic fallback
      console.warn("LLM unavailable, using heuristic fallback:", llmError?.message || llmError);
    }

    // Fallback: heuristic content generation
    const fallback = generateHeuristic(type, audience);
    return NextResponse.json(fallback, { status: 200 });
  } catch (error: any) {
    console.error("AI endpoint failed:", error);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
