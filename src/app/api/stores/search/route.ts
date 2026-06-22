import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/stores/search?q=query — autocomplete store search
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ stores: [] });
  }

  const { data: stores, error } = await supabase
    .from("stores")
    .select("id, slug, name, description, logo_url, category")
    .or(`name.ilike.%${q}%,slug.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(8);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ stores: stores || [] });
}
