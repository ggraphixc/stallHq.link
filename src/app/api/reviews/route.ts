import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/api";
import { adminClient } from "@/lib/ai";
import { sendReviewReplyNotification } from "@/lib/email";
import { apiRateLimit, addRateLimitHeaders } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");
    const storeId = searchParams.get("store_id");

    if (!productId && !storeId) {
      return NextResponse.json(
        { error: "product_id or store_id required" },
        { status: 400 }
      );
    }

    let query = supabase.from("reviews").select("*").eq("hidden", false);

    if (productId) {
      query = query.eq("product_id", productId);
    }
    if (storeId) {
      query = query.eq("store_id", storeId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    // Calculate rating summary
    const reviews = data || [];
    const count = reviews.length;
    const average =
      count > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
        : 0;

    return NextResponse.json({
      reviews,
      summary: { count, average: Math.round(average * 10) / 10 },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    const body = await request.json();
    const { product_id, store_id, reviewer_name, rating, comment, photos } = body;

    // Store-level reviews are allowed (product_id omitted); product reviews need both.
    if (!store_id || !reviewer_name || !rating) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (reviewer_name.length > 100) {
      return NextResponse.json(
        { error: "Name must be 100 characters or less" },
        { status: 400 }
      );
    }

    if (comment && comment.length > 1000) {
      return NextResponse.json(
        { error: "Comment must be 1000 characters or less" },
        { status: 400 }
      );
    }

    // Validate photos: max 4, each must be a URL string
    const validPhotos: string[] = Array.isArray(photos)
      ? photos.filter((p: unknown) => typeof p === "string" && p.startsWith("http")).slice(0, 4)
      : [];

    // Try to get user_id if logged in
    let userId: string | null = null;
    try {
      const authSupabase = await createClient();
      const { data: { user } } = await authSupabase.auth.getUser();
      if (user) userId = user.id;
    } catch { /* Not logged in */ }

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        product_id: product_id || null,
        store_id,
        reviewer_name,
        rating,
        comment: comment || null,
        user_id: userId,
        photos: validPhotos.length > 0 ? validPhotos : null,
      })
      .select()
      .single();

    if (error) throw error;

    return addRateLimitHeaders(
      NextResponse.json(data, { status: 201 }),
      rateLimitResult.headers
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

// PATCH /api/reviews — edit own review (author) or reply as store owner
// body: { id, rating?, comment?, reply? }
export async function PATCH(request: NextRequest) {
  try {
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, rating, comment, reply } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }
    if (comment !== undefined && comment.length > 1000) {
      return NextResponse.json({ error: "Comment must be 1000 characters or less" }, { status: 400 });
    }
    if (reply !== undefined && reply.length > 1000) {
      return NextResponse.json({ error: "Reply must be 1000 characters or less" }, { status: 400 });
    }
    if (rating === undefined && comment === undefined && reply === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    // Fetch review with store owner info
    const { data: review } = await authSupabase
      .from("reviews")
      .select("id, user_id, store_id, reviewer_name, stores(user_id, name, slug)")
      .eq("id", id)
      .single();
    if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const storeData = Array.isArray(review.stores) ? review.stores[0] : review.stores;
    const isStoreOwner = !!storeData && storeData.user_id === user.id;
    const isReviewAuthor = review.user_id === user.id;

    const trimmedReply = typeof reply === "string" ? reply.trim() : undefined;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (trimmedReply !== undefined) {
      // Only the store owner can post/edit a public reply
      if (!isStoreOwner) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (trimmedReply) {
        updates.reply = trimmedReply;
        updates.replied_at = new Date().toISOString();
      } else {
        updates.reply = null;
        updates.replied_at = null;
      }
    } else {
      // Rating/comment edits — only the review author (or store owner)
      if (!isReviewAuthor && !isStoreOwner) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (rating !== undefined) updates.rating = rating;
      if (comment !== undefined) updates.comment = comment || null;
    }

    const { data, error } = await authSupabase
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    // Notify the review author when a reply is published (web reply path)
    if (trimmedReply && review.user_id) {
      try {
        const admin = adminClient();
        const { data: author } = await admin.auth.admin.getUserById(review.user_id);
        const authorEmail = author?.user?.email;
        if (authorEmail && storeData) {
          await sendReviewReplyNotification({
            email: authorEmail,
            authorName: review.reviewer_name || undefined,
            storeName: storeData.name,
            storeSlug: storeData.slug,
            reply: trimmedReply,
          });
        }
      } catch (notifyError) {
        console.error("Review reply notification failed:", notifyError);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authSupabase = await createClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Fetch review with store owner info
    const { data: review } = await authSupabase
      .from("reviews")
      .select("id, user_id, stores(user_id)")
      .eq("id", id)
      .single();

    if (!review) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const storeData = Array.isArray(review.stores) ? review.stores[0] : review.stores;
    const isStoreOwner = storeData && storeData.user_id === user.id;
    const isReviewAuthor = review.user_id === user.id;

    // Only store owner OR review author can delete
    if (!isStoreOwner && !isReviewAuthor) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error } = await authSupabase.from("reviews").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
