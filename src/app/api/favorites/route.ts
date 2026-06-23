import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/favorites?device_id=xxx — list favorites for a device
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("device_id");

    if (!deviceId) {
      return NextResponse.json({ error: "device_id required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("id, product_id, store_id, created_at, products(id, name, price, image_url, images, in_stock, stores(id, slug, name))")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ favorites: data || [] });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

// POST /api/favorites — add to favorites
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { device_id, product_id, store_id } = body;

    if (!device_id || !product_id || !store_id) {
      return NextResponse.json({ error: "device_id, product_id, store_id required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("favorites")
      .upsert({ device_id, product_id, store_id }, { onConflict: "device_id,product_id" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ favorite: data });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}

// DELETE /api/favorites — remove from favorites
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { device_id, product_id } = body;

    if (!device_id || !product_id) {
      return NextResponse.json({ error: "device_id and product_id required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("device_id", device_id)
      .eq("product_id", product_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }
}
