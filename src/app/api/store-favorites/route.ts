import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/store-favorites?device_id=xxx — list store favorites for a device
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("device_id");
    if (!deviceId) return NextResponse.json({ error: "device_id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("store_favorites")
      .select("id, store_id, created_at, stores(id, name, slug, banner_url, category, city, product_count)")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ favorites: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

// POST /api/store-favorites — add a store to favorites
export async function POST(request: NextRequest) {
  try {
    const { device_id, store_id } = await request.json();
    if (!device_id || !store_id) return NextResponse.json({ error: "device_id and store_id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("store_favorites")
      .upsert({ device_id, store_id }, { onConflict: "device_id,store_id" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ favorite: data });
  } catch {
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}

// DELETE /api/store-favorites — remove a store from favorites
export async function DELETE(request: NextRequest) {
  try {
    const { device_id, store_id } = await request.json();
    if (!device_id || !store_id) return NextResponse.json({ error: "device_id and store_id required" }, { status: 400 });

    const { error } = await supabase
      .from("store_favorites")
      .delete()
      .eq("device_id", device_id)
      .eq("store_id", store_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }
}
