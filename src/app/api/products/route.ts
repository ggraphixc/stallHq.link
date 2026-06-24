import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/api";
import { getProductLimit, hasReachedProductLimit } from "@/lib/subscription";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("store_id");

    if (!storeId) {
      return NextResponse.json(
        { error: "store_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.store_id) {
      return NextResponse.json({ error: "name and store_id are required" }, { status: 400 });
    }
    if (body.price !== undefined && (typeof body.price !== "number" || body.price < 0)) {
      return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
    }

    // Verify user owns this store
    const { data: store } = await authSupabase
      .from("stores")
      .select("id")
      .eq("id", body.store_id)
      .eq("user_id", user.id)
      .single();

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Check subscription plan and product limit
    const { data: storeData } = await authSupabase
      .from("stores")
      .select("plan, subscription_expires_at, trial_ends_at")
      .eq("id", body.store_id)
      .single();

    if (storeData) {
      // Check if trial has expired
      const now = new Date();
      if (storeData.plan === "trial" && storeData.trial_ends_at && new Date(storeData.trial_ends_at) <= now) {
        return NextResponse.json(
          { error: "Your free trial has expired. Please upgrade your plan to add products.", upgradeRequired: true },
          { status: 403 }
        );
      }

      // Check if paid subscription has expired
      if (storeData.plan !== "trial" && storeData.subscription_expires_at && new Date(storeData.subscription_expires_at) <= now) {
        return NextResponse.json(
          { error: "Your subscription has expired. Please renew your plan to add products.", upgradeRequired: true },
          { status: 403 }
        );
      }

      // Check product limit
      const limit = getProductLimit({ plan: storeData.plan } as any);
      if (limit > 0) {
        const { count } = await authSupabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("store_id", body.store_id);

        if (count !== null && count >= limit) {
          return NextResponse.json(
            {
              error: `You've reached the ${limit}-product limit for your ${storeData.plan === "trial" ? "trial" : "current plan"}. Upgrade to add more products.`,
              upgradeRequired: true,
              currentCount: count,
              limit,
            },
            { status: 403 }
          );
        }
      }
    }

    const { data: product, error: insertError } = await authSupabase
      .from("products")
      .insert({
        store_id: body.store_id,
        name: body.name,
        description: body.description,
        price: body.price,
        image_url: body.image_url,
        images: body.images || [],
        category: body.category,
        has_variants: body.has_variants,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Create variants if provided
    if (body.variants && body.variants.length > 0) {
      const { error: variantError } = await authSupabase
        .from("product_variants")
        .insert(body.variants.map((v: { name: string; option_name: string; option_value: string; price?: number; stock?: number; sku?: string }) => ({
          ...v,
          product_id: product.id,
        })));

      if (variantError) throw variantError;
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
