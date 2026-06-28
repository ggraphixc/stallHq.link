import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("store_id");

    if (!storeId) {
      return NextResponse.json({ error: "store_id required" }, { status: 400 });
    }

    const { data: store, error } = await supabase
      .from("stores")
      .select("whatsapp_number, instagram_handle")
      .eq("id", storeId)
      .single();

    if (error || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({
      whatsapp: !!store.whatsapp_number,
      instagram: !!store.instagram_handle,
      whatsappNumber: store.whatsapp_number || null,
      instagramHandle: store.instagram_handle || null,
    });
  } catch (error) {
    console.error("Error checking channels:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
