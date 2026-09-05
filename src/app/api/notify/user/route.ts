import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_notifications")
      .select("id, title, body, type, read, link, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH: mark as read / mark all read
export async function PATCH(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const { id, user_id, read_all } = body;

    if (read_all && user_id) {
      await supabase
        .from("user_notifications")
        .update({ read: true })
        .eq("user_id", user_id)
        .eq("read", false);
      return NextResponse.json({ success: true });
    }

    if (id) {
      await supabase
        .from("user_notifications")
        .update({ read: true })
        .eq("id", id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "id or user_id required" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
