import { NextRequest, NextResponse } from "next/server";

// Lightweight AI content generator. Currently a heuristics-based corpus
// that returns context-aware push notification titles/bodies. Swap the
// body for a real LLM call (e.g. openrouter + a vendor's own product data)
// without changing callers.

const TONE: Record<string, string[]> = {
  content: [
    "Tip: {tip}",
    "💡 {tip}",
    "Quick tip for your store: {tip}",
    "Try this today: {tip}",
  ],
  promo: [
    "🎉 {offer}",
    "New offer from your store: {offer}",
    "Limited-time deal: {offer}",
    "Don't miss this: {offer}",
  ],
  motivation: [
    "{tip}",
    "💡 Pro tip: {tip}",
    "Small businesses win by doing {tip}",
    "Tip of the day: {tip}",
  ],
  business: [
    "📈 {insight}",
    "Business idea: {insight}",
    "News for your store: {insight}",
    "Trend watch: {insight}",
  ],
};

const TIPS: Record<string, string[]> = {
  all: [
    "Feature your bestseller on the store homepage.",
    "Send a message to your WhatsApp list before restocking.",
    "Add product photos — stores with images get more orders.",
    "Update your store hours before a long weekend.",
    "Bundle two related products at a small discount.",
    "Reply to every review — buyers notice.",
    "Pin your newest product to the top of your store.",
    "Share your stallHq.link in your WhatsApp status today.",
  ],
  customers: [
    "Explore new stores on stallHq.link every day.",
    "Save your favorite stores — you'll find them faster.",
    "Check back often — new products pop up daily.",
    "Ask a store a question before ordering — builds trust.",
    "Leave a review after a great purchase.",
  ],
  vendors: [
    "Add at least 5 products — more products means more discovery.",
    "Set your WhatsApp number so orders reach you fast.",
    "Attach a clear photo to every product.",
    "Update your store description once a week.",
    "Turn on low-stock alerts so you never oversell.",
    "Feature your highest-margin product in your store header.",
    "Reply to new reviews within 24 hours.",
    "Keep your trial store live — visitors can browse without paying.",
  ],
  trial: [
    "Your 14-day trial is ticking — add products now.",
    "You can publish your store in under 5 minutes.",
    "Try adding a product photo today.",
    "Your store URL is live — share it anywhere.",
    "Set your WhatsApp number to receive orders.",
    "A store with 3+ products looks more trustworthy.",
    "Promote your store in your WhatsApp bio.",
  ],
  paid: [
    "You're on a paid plan — keep your store polished.",
    "Review your bestsellers and promote them.",
    "Your store visitors are growing — thank them with a promo.",
    "Add a new product this week to stay fresh.",
    "Use promo cards to highlight seasonal deals.",
    "Ask happy buyers to leave a review.",
  ],
};

const OFFERS = [
  "Up to {discount}% off selected items — this week only.",
  "Free delivery on orders over ₦{threshold} this weekend.",
  "Bundle 2 items and save {discount}%.",
  "New arrivals just dropped — tap to browse.",
  "Limited stock on {product} — grab yours now.",
  "Customer favourite back in stock — hurry.",
  "Buy 2 get 1 free on {category} items.",
];

const INSIGHTS = [
  "Stores with 5+ photos per product get more orders.",
  "WhatsApp vendors do best when they reply within an hour.",
  "Weekend traffic to stores is 2x weekday traffic.",
  "Customers who see a store 3+ times are 4x more likely to buy.",
  "Promo messages sent before 10am get the most taps.",
  "Stores that post weekly see 3x more visitors.",
  "A thank-you message after order boosts repeat purchases.",
  "Bundle deals usually lift average order value by 30%.",
];

function pick(list: string[]) {
  return list[Math.floor(Math.random() * list.length)];
}

function fillTemplate(tmpl: string, audience: string) {
  let s = tmpl;
  s = s.replace("{tip}", pick(TIPS[audience] || TIPS.all));
  s = s.replace("{offer}", (() => {
    const t = pick(OFFERS);
    return t.replace("{discount}", String(Math.floor(Math.random() * 20 + 10)))
            .replace("{threshold}", String(Math.floor(Math.random() * 15000 + 5000)))
            .replace("{product}", pick(["your bestseller", "the new arrival", "favourite item"]));
  })());
  s = s.replace("{insight}", pick(INSIGHTS));
  return s;
}

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

    const toneList = TONE[type] || TONE.content;
    const raw = pick(toneList);
    const filled = fillTemplate(raw, audience);

    // Heuristic: produce a tight title from the message
    const title = filled.length > 60
      ? filled.slice(0, 57) + "…"
      : filled;

    return NextResponse.json({ title, body: filled }, { status: 200 });
  } catch (error) {
    console.error("AI endpoint failed:", error);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}