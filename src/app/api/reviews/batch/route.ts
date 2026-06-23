import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("product_ids");

    if (!idsParam) {
      return NextResponse.json({ error: "product_ids required" }, { status: 400 });
    }

    const ids = idsParam.split(",").filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ ratings: {} });
    }

    const { data, error } = await supabase
      .from("reviews")
      .select("product_id, rating")
      .in("product_id", ids);

    if (error) throw error;

    const ratings: Record<string, { count: number; average: number }> = {};

    ids.forEach((id) => {
      const productReviews = (data || []).filter((r) => r.product_id === id);
      const count = productReviews.length;
      const average = count > 0
        ? productReviews.reduce((sum, r) => sum + r.rating, 0) / count
        : 0;
      ratings[id] = { count, average: Math.round(average * 10) / 10 };
    });

    return NextResponse.json({ ratings });
  } catch {
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 });
  }
}
