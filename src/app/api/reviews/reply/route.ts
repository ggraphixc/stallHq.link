import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/api";
import { adminClient } from "@/lib/ai";
import { sendReviewReplyNotification } from "@/lib/email";
import { apiRateLimit, addRateLimitHeaders } from "@/lib/rateLimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Resolve the caller: cookie session (web) or Authorization Bearer token (mobile app).
async function resolveUser(request: NextRequest): Promise<{ id: string } | null> {
  // Web: cookie session
  const cookieClient = await createCookieClient();
  const { data: { user: cookieUser } } = await cookieClient.auth.getUser();
  if (cookieUser) return { id: cookieUser.id };

  // Mobile: bearer token
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token) {
    const anon = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user: tokenUser } } = await anon.auth.getUser(token);
    if (tokenUser) return { id: tokenUser.id };
  }
  return null;
}

// POST /api/reviews/reply — store owner posts/edits a public reply on a review
// body: { id, reply }
// Works from web (cookies) and from the mobile app (Authorization: Bearer <access_token>).
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (!rateLimitResult.success) return rateLimitResult.response!;

    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, reply } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (typeof reply !== "string" || reply.length > 1000) {
      return NextResponse.json({ error: "Reply must be 1000 characters or less" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: review } = await supabase
      .from("reviews")
      .select("id, user_id, store_id, reviewer_name, stores(name, slug, user_id)")
      .eq("id", id)
      .single();
    if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const storeData = Array.isArray(review.stores) ? review.stores[0] : review.stores;
    if (!storeData || storeData.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const trimmed = reply.trim();
    const updates: Record<string, unknown> = {
      reply: trimmed || null,
      replied_at: trimmed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    // Use the service-role client so the write always succeeds for a verified owner
    const admin = adminClient();
    const { data: updated, error } = await admin
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    // Email the review author when a reply is published
    if (trimmed && review.user_id) {
      try {
        const { data: author } = await admin.auth.admin.getUserById(review.user_id);
        const authorEmail = author?.user?.email;
        if (authorEmail) {
          await sendReviewReplyNotification({
            email: authorEmail,
            authorName: review.reviewer_name || undefined,
            storeName: storeData.name,
            storeSlug: storeData.slug,
            reply: trimmed,
          });
        }
      } catch (emailError) {
        console.error("Review reply notification failed:", emailError);
      }
    }

    return addRateLimitHeaders(NextResponse.json(updated), rateLimitResult.headers);
  } catch (error) {
    console.error("Review reply error:", error);
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 });
  }
}
