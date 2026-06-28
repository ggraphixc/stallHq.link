import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { apiRateLimit, addRateLimitHeaders } from "@/lib/rateLimit";
import { canCustomizeTheme } from "@/lib/subscription";
import { normalizeWhatsAppNumber } from "@/lib/channel";

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

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (storeError && storeError.code !== "PGRST116") throw storeError;

    return addRateLimitHeaders(NextResponse.json(store || null), rateLimitResult.headers);
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

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!body.slug || !slugRegex.test(body.slug) || body.slug.length < 3 || body.slug.length > 50) {
      return NextResponse.json(
        { error: "Store URL must be 3-50 characters, lowercase letters, numbers, and hyphens only" },
        { status: 400 }
      );
    }

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

    const { data: store, error: insertError } = await supabase
      .from("stores")
      .insert({
        user_id: user.id,
        slug: body.slug,
        name: body.name,
        description: body.description,
        whatsapp_number: body.whatsapp_number ? normalizeWhatsAppNumber(body.whatsapp_number) : "",
        instagram_handle: body.instagram_handle || null,
        category: body.category,
        email: body.email,
        setup_complete: body.setup_complete ?? false,
        plan: "trial",
        trial_ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

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

    // Prevent users from self-upgrading plan fields
    const { plan: _plan, verified: _verified, subscription_expires_at: _sub, trial_ends_at: _trial, ...safeBody } = body;

    // Normalize WhatsApp number
    if (safeBody.whatsapp_number) {
      safeBody.whatsapp_number = normalizeWhatsAppNumber(safeBody.whatsapp_number);
    }

    // Validate theme changes — only quarterly+ can customize
    if (safeBody.theme) {
      const { data: currentStore } = await supabase
        .from("stores")
        .select("plan")
        .eq("id", store.id)
        .single();

      if (currentStore && !canCustomizeTheme({ plan: currentStore.plan } as any)) {
        return NextResponse.json(
          { error: "Custom themes are available on Growth and Premium plans. Upgrade your plan to unlock.", upgradeRequired: true },
          { status: 403 }
        );
      }
    }

    // If slug is being changed, check uniqueness
    if (safeBody.slug) {
      const { data: existingStore } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", safeBody.slug)
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
      .update({ ...safeBody, updated_at: new Date().toISOString() })
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
