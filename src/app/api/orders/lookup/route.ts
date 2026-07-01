import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { strictLimiter, checkRateLimit, getClientIp, addRateLimitHeaders } from "@/lib/rateLimit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/orders/lookup — find orders by email address (public, rate-limited).
// Returns only non-sensitive fields to prevent data leakage.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(strictLimiter, ip);
  if (!rl.success) return rl.response!;

  const body = await request.json();
  const { email } = body;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  // Find orders where customer_email matches — return minimal fields only
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, store_id, status, created_at, stores(name, slug)")
    .ilike("customer_email", email)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return addRateLimitHeaders(
    NextResponse.json({ orders: orders || [] }),
    rl.headers
  );
}
