import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/api";

const admin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resolveUser(request: NextRequest): Promise<{ id: string } | null> {
  const token = request.headers.get("x-access-token");
  if (token) {
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) return data.user;
  }
  try {
    const cookieClient = await createCookieClient();
    const { data } = await cookieClient.auth.getUser();
    if (data.user) return data.user;
  } catch {}
  return null;
}

async function ensurePublicMembership(roomId: string, userId: string) {
  const { data: room } = await admin
    .from("chat_rooms")
    .select("type")
    .eq("id", roomId)
    .single();
  if (!room || room.type !== "public") return false;

  const { data: member } = await admin
    .from("room_members")
    .select("id")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!member) {
    await admin.from("room_members").insert({
      room_id: roomId,
      user_id: userId,
      role: "member",
    });
  }

  const { data: notif } = await admin
    .from("room_notifications")
    .select("id")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!notif) {
    await admin.from("room_notifications").insert({
      room_id: roomId,
      user_id: userId,
    });
  }

  return true;
}

/**
 * GET /api/chat/global/messages?room_id=xxx
 * Public rooms: anyone (guest or signed-in) can read.
 * Private/admin rooms: members only.
 * Auth: optional x-access-token or cookie session.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("room_id");
    const before = searchParams.get("before");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    if (!roomId) return NextResponse.json({ error: "room_id required" }, { status: 400 });

    const { data: room } = await admin
      .from("chat_rooms")
      .select("id, type, name, is_active")
      .eq("id", roomId)
      .single();

    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    if (room.type !== "public") {
      if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
      const { data: member } = await admin
        .from("room_members")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    let query = admin
      .from("room_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (before) query = query.lt("created_at", before);
    query = query.limit(limit);

    const { data: messages } = await query;
    const ordered = (messages || []).slice().reverse();

    // Mark read for signed-in users
    if (user) {
      await ensurePublicMembership(roomId, user.id);
      await admin
        .from("room_notifications")
        .update({ unread_count: 0, last_read_at: new Date().toISOString() })
        .eq("room_id", roomId)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ messages: ordered, room });
  } catch (err) {
    console.error("[global-chat messages] GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * POST /api/chat/global/messages
 * Send a message. Requires sign-in. Public rooms auto-join on first send.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { room_id, content, message_type } = body;

    if (!room_id || !content?.trim()) {
      return NextResponse.json({ error: "room_id and content required" }, { status: 400 });
    }

    const { data: room } = await admin
      .from("chat_rooms")
      .select("id, type, is_active")
      .eq("id", room_id)
      .single();

    if (!room || !room.is_active) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const { data: member } = await admin
      .from("room_members")
      .select("id")
      .eq("room_id", room_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      if (room.type !== "public") {
        return NextResponse.json({ error: "Not a member" }, { status: 403 });
      }
      await ensurePublicMembership(room_id, user.id);
    }

    const trimmed = content.trim().slice(0, 2000);
    const { data: msg, error } = await admin
      .from("room_messages")
      .insert({
        room_id,
        sender_id: user.id,
        content: trimmed,
        message_type: message_type || "text",
      })
      .select()
      .single();

    if (error) throw error;

    // Bump room updated_at for list ordering
    await admin
      .from("chat_rooms")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", room_id);

    // Increment unread for other members
    const { data: members } = await admin
      .from("room_members")
      .select("user_id")
      .eq("room_id", room_id);

    if (members?.length) {
      for (const m of members) {
        if (m.user_id === user.id) continue;
        const { data: notif } = await admin
          .from("room_notifications")
          .select("unread_count")
          .eq("room_id", room_id)
          .eq("user_id", m.user_id)
          .maybeSingle();

        if (notif) {
          await admin
            .from("room_notifications")
            .update({
              unread_count: (notif.unread_count || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("room_id", room_id)
            .eq("user_id", m.user_id);
        } else {
          await admin.from("room_notifications").insert({
            room_id,
            user_id: m.user_id,
            unread_count: 1,
          });
        }
      }
    }

    return NextResponse.json({ message: msg });
  } catch (err) {
    console.error("[global-chat messages] POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
