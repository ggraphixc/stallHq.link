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

/**
 * GET /api/chat/global
 * List active chat rooms. Works for guests (public rooms only) and members.
 * Auth: optional x-access-token or cookie session.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("room_id");

    if (roomId) {
      const { data: room } = await admin
        .from("chat_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (!room || (!room.is_active && room.type !== "public")) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }

      let member = null;
      if (user) {
        const { data } = await admin
          .from("room_members")
          .select("*")
          .eq("room_id", roomId)
          .eq("user_id", user.id)
          .maybeSingle();
        member = data;
      }

      // Private/admin rooms require membership; public is open to everyone
      if (room.type !== "public" && !member) {
        if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
        return NextResponse.json({ error: "Not a member" }, { status: 403 });
      }

      const { data: messages } = await admin
        .from("room_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      const { count: memberCount } = await admin
        .from("room_members")
        .select("id", { count: "exact", head: true })
        .eq("room_id", roomId);

      let unread = 0;
      if (user) {
        const { data: notif } = await admin
          .from("room_notifications")
          .select("unread_count")
          .eq("room_id", roomId)
          .eq("user_id", user.id)
          .maybeSingle();
        unread = notif?.unread_count || 0;
      }

      const { data: senders } = user
        ? await admin
            .from("room_members")
            .select("user_id")
            .eq("room_id", roomId)
            .limit(50)
        : { data: [] };

      return NextResponse.json({
        room,
        member: !!member,
        role: member?.role || "member",
        messages: messages || [],
        unread_count: unread,
        member_count: memberCount || 0,
        can_send: !!user && (room.type === "public" || !!member),
        sender_ids: (senders || []).map((s: any) => s.user_id),
      });
    }

    // List rooms (guests see public only)
    let query = admin
      .from("chat_rooms")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (!user) query = query.eq("type", "public");

    const { data: rooms } = await query;

    const enriched = await Promise.all(
      (rooms || []).map(async (room: any) => {
        const [{ count: memberCount }, { data: lastMsg }] = await Promise.all([
          admin
            .from("room_members")
            .select("id", { count: "exact", head: true })
            .eq("room_id", room.id),
          admin
            .from("room_messages")
            .select("content, created_at, sender_id")
            .eq("room_id", room.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        let isMember = false;
        let role = "member";
        let unread = 0;
        if (user) {
          const { data: member } = await admin
            .from("room_members")
            .select("role")
            .eq("room_id", room.id)
            .eq("user_id", user.id)
            .maybeSingle();
          isMember = !!member;
          role = member?.role || "member";
          if (isMember) {
            const { data: notif } = await admin
              .from("room_notifications")
              .select("unread_count")
              .eq("room_id", room.id)
              .eq("user_id", user.id)
              .maybeSingle();
            unread = notif?.unread_count || 0;
          }
        }

        return {
          ...room,
          is_member: isMember,
          role,
          unread_count: unread,
          members: { count: memberCount || 0 },
          member_count: memberCount || 0,
          last_message: lastMsg?.content || null,
          last_message_at: lastMsg?.created_at || null,
          last_sender_id: lastMsg?.sender_id || null,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("[global-chat] GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * POST /api/chat/global
 * Create a new public chat room (signed-in users only).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description, type } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Room name required" }, { status: 400 });
    }

    const isAdmin = user.id === (process.env.ADMIN_USER_ID || "").split(",")[0]?.trim();
    const roomType = isAdmin ? type || "public" : "public";

    const { data: room, error } = await admin
      .from("chat_rooms")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        type: roomType,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    await admin.from("room_members").insert({
      room_id: room.id,
      user_id: user.id,
      role: isAdmin ? "admin" : "member",
    });
    await admin.from("room_notifications").insert({
      room_id: room.id,
      user_id: user.id,
    });

    return NextResponse.json(room, { status: 201 });
  } catch (err) {
    console.error("[global-chat] POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * PATCH /api/chat/global
 * Join (or leave) a public room.
 * Body: { room_id, action: "join" | "leave" }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { room_id, action } = await request.json();
    if (!room_id) return NextResponse.json({ error: "room_id required" }, { status: 400 });

    const { data: room } = await admin
      .from("chat_rooms")
      .select("id, type, is_active")
      .eq("id", room_id)
      .single();

    if (!room || !room.is_active) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (action === "leave") {
      await admin
        .from("room_members")
        .delete()
        .eq("room_id", room_id)
        .eq("user_id", user.id);
      await admin
        .from("room_notifications")
        .delete()
        .eq("room_id", room_id)
        .eq("user_id", user.id);
      return NextResponse.json({ ok: true, joined: false });
    }

    // join
    if (room.type !== "public") {
      return NextResponse.json({ error: "Cannot join this room" }, { status: 403 });
    }

    const { data: existing } = await admin
      .from("room_members")
      .select("id")
      .eq("room_id", room_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      await admin.from("room_members").insert({
        room_id,
        user_id: user.id,
        role: "member",
      });
    }

    const { data: notif } = await admin
      .from("room_notifications")
      .select("id")
      .eq("room_id", room_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!notif) {
      await admin.from("room_notifications").insert({
        room_id,
        user_id: user.id,
      });
    }

    return NextResponse.json({ ok: true, joined: true });
  } catch (err) {
    console.error("[global-chat] PATCH error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
