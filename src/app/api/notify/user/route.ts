import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/api";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resolveUserId(request: NextRequest): Promise<string | null> {
  const token = request.headers.get("x-access-token");
  if (token) {
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) return data.user.id;
  }
  try {
    const cookieClient = await createCookieClient();
    const { data } = await cookieClient.auth.getUser();
    if (data.user) return data.user.id;
  } catch {}
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await admin
      .from("user_notifications")
      .select("id, title, body, type, read, link, created_at, image_url, action_label, action_link")
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
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, read_all } = body;

    if (read_all) {
      await admin
        .from("user_notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);
      return NextResponse.json({ success: true });
    }

    if (id) {
      const { data: notif } = await admin
        .from("user_notifications")
        .select("id")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (!notif) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      await admin
        .from("user_notifications")
        .update({ read: true })
        .eq("id", id)
        .eq("user_id", userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "id or read_all required" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
