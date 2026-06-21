import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/api";
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

    let query = supabase.from("reviews").select("*");

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
    const { product_id, store_id, reviewer_name, rating, comment } = body;

    if (!product_id || !store_id || !reviewer_name || !rating) {
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

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        product_id,
        store_id,
        reviewer_name,
        rating,
        comment: comment || null,
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

    // Verify user owns the store this review belongs to
    const { data: review } = await authSupabase
      .from("reviews")
      .select("id, stores(user_id)")
      .eq("id", id)
      .single();

    if (!review) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const storeData = Array.isArray(review.stores) ? review.stores[0] : review.stores;
    if (!storeData || storeData.user_id !== user.id) {
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
