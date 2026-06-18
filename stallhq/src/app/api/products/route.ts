import { NextRequest, NextResponse } from "next/server";
import { createProduct } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const product = await createProduct({
      store_id: body.store_id,
      name: body.name,
      description: body.description,
      price: body.price,
      image_url: body.image_url,
      category: body.category,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
