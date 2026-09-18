import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resolveUserId(request: NextRequest): Promise<string | null> {
  // Mobile: x-access-token header
  const authHeader = request.headers.get("x-access-token");
  if (authHeader) {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(authHeader);
    if (!error && user) return user.id;
  }

  // Fallback: query param or body user_id (legacy web)
  const { searchParams } = new URL(request.url);
  return searchParams.get("user_id");
}

/**
 * GET /api/notifications/user — List user's notifications.
 * Auth: x-access-token header OR ?user_id= query param.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const { data, error } = await supabaseAdmin
      .from("user_notifications")
      .select("id, title, body, type, read, link, created_at, image_url, action_label, action_link")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ notifications: data || [] });
  } catch (error) {
    console.error("[notifications/user] GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications/user — Mark notifications as read.
 * Body: { id?: string, read_all?: boolean }
 * Auth: x-access-token header.
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, read_all } = body;

    if (read_all) {
      await supabaseAdmin
        .from("user_notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);
      return NextResponse.json({ success: true });
    }

    if (id) {
      // Verify the notification belongs to this user
      const { data: notif } = await supabaseAdmin
        .from("user_notifications")
        .select("id")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (!notif) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      await supabaseAdmin
        .from("user_notifications")
        .update({ read: true })
        .eq("id", id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "id or read_all required" }, { status: 400 });
  } catch (error) {
    console.error("[notifications/user] PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
