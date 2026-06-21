import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSupabase = await createClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify user owns this product's store
    const { data: product } = await authSupabase
      .from("products")
      .select("id, store_id, stores(user_id)")
      .eq("id", id)
      .single();

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const storeData = Array.isArray(product.stores) ? product.stores[0] : product.stores;
    if (!storeData || storeData.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Extract variants from body
    const { variants, ...productUpdates } = body;

    const { data: updatedProduct, error: updateError } = await authSupabase
      .from("products")
      .update(productUpdates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Handle variants if provided
    if (variants !== undefined) {
      await authSupabase
        .from("product_variants")
        .delete()
        .eq("product_id", id);

      if (variants && variants.length > 0) {
        const { error: variantError } = await authSupabase
          .from("product_variants")
          .insert(variants.map((v: { name: string; option_name: string; option_value: string; price?: number; stock?: number; sku?: string }) => ({
            ...v,
            product_id: id,
          })));

        if (variantError) throw variantError;
      }
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSupabase = await createClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify user owns this product's store
    const { data: product } = await authSupabase
      .from("products")
      .select("id, stores(user_id)")
      .eq("id", id)
      .single();

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const storeData = Array.isArray(product.stores) ? product.stores[0] : product.stores;
    if (!storeData || storeData.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete variants first, then product
    await authSupabase
      .from("product_variants")
      .delete()
      .eq("product_id", id);

    const { error: deleteError } = await authSupabase
      .from("products")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
