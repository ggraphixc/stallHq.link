import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("platform_settings")
      .select("*");

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { settings } = body;

    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("platform_settings")
      .upsert(rows, { onConflict: "key" });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
