import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get auth user from cookie
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create preferences
    const { data: existing } = await supabase
      .from("email_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(existing);
    }

    // Create default preferences
    const { data: created, error: createError } = await supabase
      .from("email_preferences")
      .insert({ user_id: user.id })
      .select()
      .single();

    if (createError) {
      console.error("[EmailPreferences] Create error:", createError);
      return NextResponse.json({ error: "Failed to create preferences" }, { status: 500 });
    }

    return NextResponse.json(created);
  } catch (error) {
    console.error("[EmailPreferences] Error:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get auth user from cookie
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Allowed fields
    const allowedFields = [
      "weekly_analytics",
      "monthly_analytics",
      "trial_nurture",
      "order_notifications",
      "status_updates",
      "low_stock_alerts",
      "support_replies",
      "marketing_tips",
    ];

    const updates: Record<string, boolean> = {};
    for (const key of allowedFields) {
      if (key in body && typeof body[key] === "boolean") {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Upsert preferences
    const { data, error } = await supabase
      .from("email_preferences")
      .upsert(
        { user_id: user.id, ...updates },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[EmailPreferences] Update error:", error);
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[EmailPreferences] Error:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
