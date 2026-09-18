import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/notifications/preferences — Get user's notification preferences.
 * Requires x-access-token header (mobile) or cookie session (web).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-access-token");
    let userId: string | null = null;

    if (authHeader) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(authHeader);
      if (!error && user) userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: prefs } = await supabaseAdmin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Return defaults if no preferences exist
    const preferences = prefs || {
      order_updates: true,
      trial_reminders: true,
      product_alerts: true,
      review_replies: true,
      marketing: false,
    };

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("[notif-prefs] GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications/preferences — Update notification preferences.
 * Body: { order_updates?: boolean, trial_reminders?: boolean, ... }
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-access-token");
    let userId: string | null = null;

    if (authHeader) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(authHeader);
      if (!error && user) userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const allowedKeys = ["order_updates", "trial_reminders", "product_alerts", "review_replies", "marketing"];
    const updates: Record<string, boolean> = {};

    for (const key of allowedKeys) {
      if (key in body && typeof body[key] === "boolean") {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Upsert preferences
    const { error } = await supabaseAdmin
      .from("notification_preferences")
      .upsert(
        {
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) throw error;

    // Fetch updated prefs
    const { data: updated } = await supabaseAdmin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    return NextResponse.json({ preferences: updated });
  } catch (error) {
    console.error("[notif-prefs] PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
