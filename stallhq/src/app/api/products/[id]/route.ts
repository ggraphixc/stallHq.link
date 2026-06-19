import { NextRequest, NextResponse } from "next/server";
import {
  updateProduct,
  deleteProduct,
  deleteProductVariants,
  createProductVariants,
} from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Extract variants from body (don't pass to updateProduct)
    const { variants, ...productUpdates } = body;

    const product = await updateProduct(id, productUpdates);

    // Handle variants if provided
    if (variants !== undefined) {
      // Delete existing variants
      await deleteProductVariants(id);

      // Create new variants if any
      if (variants && variants.length > 0) {
        await createProductVariants(id, variants);
      }
    }

    return NextResponse.json(product);
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
    const { id } = await params;
    await deleteProduct(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
