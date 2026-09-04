import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { adminClient } from "@/lib/ai";
import { sendReviewModerationEmail } from "@/lib/email";

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_IDS.includes(user.id)) return null;
  return user;
}

// GET /api/admin/reviews?hidden=true|false — list reviews with store/product context
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const hidden = req.nextUrl.searchParams.get("hidden");
    const supabase = adminClient();

    let query = supabase
      .from("reviews")
      .select("*, stores(name, slug), products(name)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (hidden === "true") query = query.eq("hidden", true);
    else if (hidden === "false") query = query.eq("hidden", false);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("Admin reviews list error:", error?.message || error);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

// Resolve the store owner's email for moderation notifications.
// Prefers the store's public email; falls back to the auth account email.
async function getStoreOwnerEmail(supabase: ReturnType<typeof adminClient>, storeId: string): Promise<{ email: string | null; storeName: string; storeSlug: string } | null> {
  const { data: store } = await supabase
    .from("stores")
    .select("name, slug, email, user_id")
    .eq("id", storeId)
    .single();
  if (!store) return null;

  let ownerEmail = store.email || null;
  if (!ownerEmail && store.user_id) {
    const { data: user } = await supabase.auth.admin.getUserById(store.user_id);
    ownerEmail = user?.user?.email || null;
  }
  return { email: ownerEmail, storeName: store.name, storeSlug: store.slug };
}

// PATCH /api/admin/reviews — body: { id, hidden: boolean } (soft hide / unhide)
export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, hidden } = await req.json();
    if (!id || typeof hidden !== "boolean") {
      return NextResponse.json({ error: "id and hidden (boolean) required" }, { status: 400 });
    }

    const supabase = adminClient();
    const { data: existing } = await supabase
      .from("reviews")
      .select("id, hidden, store_id, reviewer_name, comment")
      .eq("id", id)
      .single();
    if (!existing) return NextResponse.json({ error: "Review not found" }, { status: 404 });

    const { error } = await supabase
      .from("reviews")
      .update({ hidden, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    // Notify the store owner when a review is first hidden (not on unhide)
    if (hidden && !existing.hidden) {
      try {
        const owner = await getStoreOwnerEmail(supabase, existing.store_id);
        if (owner?.email) {
          await sendReviewModerationEmail({
            email: owner.email,
            storeName: owner.storeName,
            storeSlug: owner.storeSlug,
            reviewerName: existing.reviewer_name || "Anonymous",
            reviewSnippet: existing.comment || undefined,
            action: "hidden",
          });
        }
      } catch (emailError: any) {
        console.error("Review hidden notification failed:", emailError?.message || emailError);
      }
    }

    return NextResponse.json({ success: true, hidden });
  } catch (error: any) {
    console.error("Admin review update error:", error?.message || error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

// DELETE /api/admin/reviews?id=... — permanently remove a review
export async function DELETE(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const supabase = adminClient();
    const { data: doomed } = await supabase
      .from("reviews")
      .select("id, store_id, reviewer_name, comment")
      .eq("id", id)
      .single();
    if (!doomed) return NextResponse.json({ error: "Review not found" }, { status: 404 });

    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) throw error;

    // Notify the store owner that the review was permanently removed
    try {
      const owner = await getStoreOwnerEmail(supabase, doomed.store_id);
      if (owner?.email) {
        await sendReviewModerationEmail({
          email: owner.email,
          storeName: owner.storeName,
          storeSlug: owner.storeSlug,
          reviewerName: doomed.reviewer_name || "Anonymous",
          reviewSnippet: doomed.comment || undefined,
          action: "deleted",
        });
      }
    } catch (emailError: any) {
      console.error("Review deletion notification failed:", emailError?.message || emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin review delete error:", error?.message || error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
