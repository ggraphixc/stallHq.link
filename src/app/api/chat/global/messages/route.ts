import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/api";
import { sendRoomMessagePush } from "@/lib/push";

const admin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resolveUser(request: NextRequest): Promise<{ id: string; email?: string | null; user_metadata?: Record<string, unknown> | null } | null> {
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

const REACTION_EMOJIS = new Set(["👍", "❤️"]);

async function ensurePublicMembership(roomId: string, userId: string) {
  const [memberRes, notifRes] = await Promise.all([
    admin
      .from("room_members")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("room_notifications")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const writes: PromiseLike<unknown>[] = [];
  if (!memberRes.data) {
    writes.push(
      admin.from("room_members").insert({
        room_id: roomId,
        user_id: userId,
        role: "member",
      })
    );
  }
  if (!notifRes.data) {
    writes.push(
      admin.from("room_notifications").insert({
        room_id: roomId,
        user_id: userId,
      })
    );
  }
  if (writes.length) await Promise.all(writes);

  return true;
}

async function handleReaction(user: { id: string }, body: Record<string, unknown>): Promise<NextResponse> {
  const message_id = typeof body.message_id === "string" ? body.message_id : "";
  const emoji = typeof body.emoji === "string" ? body.emoji : "";
  if (!message_id || !REACTION_EMOJIS.has(emoji)) {
    return NextResponse.json(
      { error: "message_id and a supported emoji required" },
      { status: 400 }
    );
  }

  const { data: msg, error: msgErr } = await admin
    .from("room_messages")
    .select("id, room_id, metadata, is_deleted")
    .eq("id", message_id)
    .single();
  if (msgErr || !msg || (msg as { is_deleted?: boolean }).is_deleted) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  const roomId = (msg as { room_id: string }).room_id;

  const { data: room } = await admin
    .from("chat_rooms")
    .select("type")
    .eq("id", roomId)
    .single();
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  if (room.type !== "public") {
    const { data: member } = await admin
      .from("room_members")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const existingMeta =
    ((msg as { metadata?: Record<string, unknown> | null }).metadata as Record<string, unknown>) || {};
  const metadata: Record<string, unknown> = { ...existingMeta };
  const reactions = {
    ...(((existingMeta.reactions as Record<string, string[]>) || {})),
  };
  const list = [...(reactions[emoji] || [])];
  const at = list.indexOf(user.id);
  if (at >= 0) list.splice(at, 1);
  else list.push(user.id);
  if (list.length) reactions[emoji] = list;
  else delete reactions[emoji];
  metadata.reactions = reactions;

  const { data: updated, error: updErr } = await admin
    .from("room_messages")
    .update({ metadata })
    .eq("id", message_id)
    .select()
    .single();
  if (updErr) throw updErr;

  return NextResponse.json({ message: updated });
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
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (before) query = query.lt("created_at", before);
    query = query.limit(limit);

    const messagesPromise = (async () => {
      let { data: messages } = await query;
      if (!messages) {
        let fallback = admin
          .from("room_messages")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false });
        if (before) fallback = fallback.lt("created_at", before);
        const retried = await fallback.limit(limit);
        messages = retried.data;
      }
      return (messages || []).slice().reverse();
    })();

    const readPromise: Promise<unknown> = user
      ? (async () => {
          if (room.type === "public") await ensurePublicMembership(roomId, user.id);
          await admin
            .from("room_notifications")
            .update({ unread_count: 0, last_read_at: new Date().toISOString() })
            .eq("room_id", roomId)
            .eq("user_id", user.id);
        })()
      : Promise.resolve();

    const [ordered] = await Promise.all([messagesPromise, readPromise]);

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

    if (body.action === "react") {
      return handleReaction(user, body);
    }

    const { room_id, content, message_type, reply_to } = body;

    if (!room_id || !content?.trim()) {
      return NextResponse.json({ error: "room_id and content required" }, { status: 400 });
    }

    let roomQuery = await admin
      .from("chat_rooms")
      .select("id, type, is_active, name")
      .eq("id", room_id)
      .single();

    let room = roomQuery.data as any;

    // Try to read purpose if the column exists
    if (room) {
      const purposeRes = await admin
        .from("chat_rooms")
        .select("purpose")
        .eq("id", room_id)
        .maybeSingle();
      if (!purposeRes.error && purposeRes.data) {
        room.purpose = (purposeRes.data as any).purpose;
      }
    }

    if (!room || !room.is_active) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Purpose restrictions (with fallback when purpose column not yet migrated)
    let purpose = (room as any).purpose as string | undefined;
    if (!purpose) {
      if (room_id === "00000000-0000-0000-0000-000000000002" || /support/i.test((room as any).name || "")) {
        purpose = "support";
      } else if (room_id === "00000000-0000-0000-0000-000000000003" || /announce/i.test((room as any).name || "")) {
        purpose = "announcements";
      } else {
        purpose = "general";
      }
    }
    const isAdminIds = (process.env.ADMIN_USER_ID || "")
      .split(",").map((s) => s.trim()).filter(Boolean);
    const isPlatformAdmin = isAdminIds.includes(user.id);

    const { data: memberRow } = await admin
      .from("room_members")
      .select("id, role")
      .eq("room_id", room_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const privileged = isPlatformAdmin || memberRow?.role === "admin" || memberRow?.role === "moderator";

    if (purpose === "announcements" && !privileged) {
      return NextResponse.json(
        { error: "Only moderators can post in Announcements" },
        { status: 403 }
      );
    }

    if (!memberRow) {
      if (room.type !== "public") {
        return NextResponse.json({ error: "Not a member" }, { status: 403 });
      }
      await ensurePublicMembership(room_id, user.id);
    }

    const trimmed = content.trim().slice(0, 2000);

    const metadata: Record<string, unknown> = {};
    if (reply_to && typeof reply_to === "object") {
      const rt = reply_to as { id?: unknown; content?: unknown; sender_id?: unknown };
      if (typeof rt.id === "string" && rt.id && typeof rt.content === "string" && rt.content) {
        metadata.reply_to = {
          id: rt.id,
          content: rt.content.slice(0, 200),
          ...(typeof rt.sender_id === "string" ? { sender_id: rt.sender_id } : {}),
        };
      }
    }

    const insertRow: Record<string, unknown> = {
      room_id,
      sender_id: user.id,
      content: trimmed,
      message_type: message_type || "text",
    };
    if (Object.keys(metadata).length) insertRow.metadata = metadata;

    const { data: msg, error } = await admin
      .from("room_messages")
      .insert(insertRow)
      .select()
      .single();

    if (error) throw error;

    const nowIso = new Date().toISOString();

    const results = await Promise.all([
      admin
        .from("chat_rooms")
        .update({ updated_at: nowIso })
        .eq("id", room_id),
      admin.from("room_members").select("user_id").eq("room_id", room_id),
      admin
        .from("room_notifications")
        .select("user_id, unread_count")
        .eq("room_id", room_id),
    ]);
    const membersRes = results[1] as { data: { user_id: string }[] | null };
    const notifsRes = results[2] as { data: { user_id: string; unread_count: number | null }[] | null };

    const others = (membersRes.data || []).filter((m) => m.user_id !== user.id);
    if (others.length) {
      const current = new Map<string, number>(
        (notifsRes.data || []).map((n) => [n.user_id, n.unread_count || 0])
      );
      const rows = others.map((m) => ({
        room_id,
        user_id: m.user_id,
        unread_count: (current.get(m.user_id) ?? 0) + 1,
        updated_at: nowIso,
      }));
      const { error: upsertErr } = await admin
        .from("room_notifications")
        .upsert(rows, { onConflict: "room_id,user_id" });
      if (upsertErr) {
        console.error("[global-chat messages] unread upsert failed:", upsertErr);
      }
    }

    // Fire-and-forget push to room members (sender skipped, muted skipped, 50-token cap)
    void sendRoomMessagePush({
      roomId: room_id,
      roomName: room?.name,
      senderId: user.id,
      senderName:
        (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
        (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
        user.email ||
        null,
      content: trimmed,
      memberIds: (membersRes.data || []).map((m) => m.user_id),
    }).catch(console.error);

    return NextResponse.json({ message: msg });
  } catch (err) {
    console.error("[global-chat messages] POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
