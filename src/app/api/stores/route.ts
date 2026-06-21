import { NextRequest, NextResponse } from "next/server";
import { createStore, getStoreByUserId } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/api";
import { apiRateLimit, addRateLimitHeaders } from "@/lib/rateLimit";

export async function GET(request: Request) {
  const rateLimitResult = await apiRateLimit(request);
  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const store = await getStoreByUserId(user.id);
    return addRateLimitHeaders(NextResponse.json(store), rateLimitResult.headers);
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { error: "Failed to fetch store" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await apiRateLimit(request);
  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Check slug uniqueness
    const { data: existingStore } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", body.slug)
      .single();

    if (existingStore) {
      return NextResponse.json(
        { error: "This store URL is already taken" },
        { status: 409 }
      );
    }

    const store = await createStore({
      user_id: user.id,
      slug: body.slug,
      name: body.name,
      description: body.description,
      whatsapp_number: body.whatsapp_number,
      category: body.category,
      email: body.email,
      setup_complete: body.setup_complete ?? false,
    });

    return NextResponse.json(store, { status: 201 });
  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json(
      { error: "Failed to create store" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimitResult = await apiRateLimit(request);
  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get user's store
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // If slug is being changed, check uniqueness
    if (body.slug) {
      const { data: existingStore } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", body.slug)
        .neq("id", store.id)
        .single();

      if (existingStore) {
        return NextResponse.json(
          { error: "This store URL is already taken" },
          { status: 409 }
        );
      }
    }

    const { data: updatedStore, error } = await supabase
      .from("stores")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", store.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error("Error updating store:", error);
    return NextResponse.json(
      { error: "Failed to update store" },
      { status: 500 }
    );
  }
}
