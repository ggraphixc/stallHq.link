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

      const memberPromise = user
        ? admin
            .from("room_members")
            .select("*")
            .eq("room_id", roomId)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null, ...({} as object) });

      const notifPromise = user
        ? admin
            .from("room_notifications")
            .select("unread_count")
            .eq("room_id", roomId)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null, ...({} as object) });

      const messagesPromise = admin
        .from("room_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      const [memberRes, notifRes, messagesRes, memberCountRes, sendersRes] = await Promise.all([
        memberPromise,
        notifPromise,
        messagesPromise,
        admin
          .from("room_members")
          .select("id", { count: "exact", head: true })
          .eq("room_id", roomId),
        user
          ? admin
              .from("room_members")
              .select("user_id")
              .eq("room_id", roomId)
              .limit(50)
          : Promise.resolve({ data: [], error: null, ...({} as object) }),
      ]);

      const member = (memberRes as { data: { role?: string } | null }).data;
      const unread =
        ((notifRes as { data: { unread_count?: number } | null }).data?.unread_count as number) || 0;
      const messages = (messagesRes as { data: unknown[] | null }).data || [];

      // Private/admin rooms require membership; public is open to everyone
      if (room.type !== "public" && !member) {
        if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
        return NextResponse.json({ error: "Not a member" }, { status: 403 });
      }

      const memberCount = memberCountRes.count || 0;
      const senders = (sendersRes as { data: { user_id: string }[] | null }).data || [];

      const isAdminIds = (process.env.ADMIN_USER_ID || "")
        .split(",").map((s) => s.trim()).filter(Boolean);
      const isPlatformAdmin = !!user && isAdminIds.includes(user.id);
      const canManage =
        isPlatformAdmin || member?.role === "admin" || member?.role === "moderator";

      // purpose column may not exist yet — infer for default rooms
      let purpose = (room as any).purpose as string | undefined;
      if (!purpose) {
        if (room.id === "00000000-0000-0000-0000-000000000002" || /support/i.test(room.name)) {
          purpose = "support";
        } else if (room.id === "00000000-0000-0000-0000-000000000003" || /announce/i.test(room.name)) {
          purpose = "announcements";
        } else {
          purpose = "general";
        }
      }

      return NextResponse.json({
        room: { ...room, purpose },
        member: !!member,
        role: member?.role || "member",
        can_manage: canManage,
        messages: messages || [],
        unread_count: unread,
        member_count: memberCount || 0,
        can_send: !!user && (room.type === "public" || !!member),
        sender_ids: senders.map((s) => s.user_id),
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
    const roomList = rooms || [];

    // Batch membership + unread for the signed-in user (2 queries, not 2N)
    const roomIds = roomList.map((r) => r.id);
    let memberMap = new Map<string, string>();
    let unreadMap = new Map<string, number>();
    if (user && roomIds.length) {
      const [membersRes, notifsRes] = await Promise.all([
        admin
          .from("room_members")
          .select("room_id, role")
          .eq("user_id", user.id)
          .in("room_id", roomIds),
        admin
          .from("room_notifications")
          .select("room_id, unread_count")
          .eq("user_id", user.id)
          .in("room_id", roomIds),
      ]);
      memberMap = new Map(
        ((membersRes.data || []) as { room_id: string; role: string }[]).map((m) => [
          m.room_id,
          m.role,
        ])
      );
      unreadMap = new Map(
        ((notifsRes.data || []) as { room_id: string; unread_count: number | null }[]).map((n) => [
          n.room_id,
          n.unread_count || 0,
        ])
      );
    }

    const enriched = await Promise.all(
      roomList.map(async (room: any) => {
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

        const role = memberMap.get(room.id);
        const isMember = !!role;
        const unread = unreadMap.get(room.id) || 0;

        let purpose = room.purpose as string | undefined;
        if (!purpose) {
          if (room.id === "00000000-0000-0000-0000-000000000002" || /support/i.test(room.name)) {
            purpose = "support";
          } else if (room.id === "00000000-0000-0000-0000-000000000003" || /announce/i.test(room.name)) {
            purpose = "announcements";
          } else {
            purpose = "general";
          }
        }

        return {
          ...room,
          purpose,
          is_member: isMember,
          role: role || "member",
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
 * Actions:
 *  - { room_id, action: "join" | "leave" } — membership (any signed-in user on public rooms)
 *  - { room_id, action: "settings", name?, description?, purpose?, type?, is_active? } — room settings
 *    Gated to room admin/moderator or platform ADMIN_USER_ID.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { room_id, action } = body;
    if (!room_id) return NextResponse.json({ error: "room_id required" }, { status: 400 });

    const { data: room } = await admin
      .from("chat_rooms")
      .select("id, type, is_active")
      .eq("id", room_id)
      .single();

    if (!room || !room.is_active) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (action === "settings") {
      const isAdminIds = (process.env.ADMIN_USER_ID || "")
        .split(",").map((s) => s.trim()).filter(Boolean);
      const isPlatformAdmin = isAdminIds.includes(user.id);

      const { data: memberRow } = await admin
        .from("room_members")
        .select("role")
        .eq("room_id", room_id)
        .eq("user_id", user.id)
        .maybeSingle();

      const canEdit =
        isPlatformAdmin || memberRow?.role === "admin" || memberRow?.role === "moderator";
      if (!canEdit) {
        return NextResponse.json({ error: "Room settings require admin/moderator role" }, { status: 403 });
      }

      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim().slice(0, 80);
      if (typeof body.description === "string") patch.description = body.description.trim().slice(0, 500) || null;
      if (["general", "support", "announcements"].includes(body.purpose)) patch.purpose = body.purpose;
      if (["public", "private", "admin"].includes(body.type)) {
        if (!isPlatformAdmin && body.type !== room.type) {
          return NextResponse.json({ error: "Only platform admins can change room visibility" }, { status: 403 });
        }
        patch.type = body.type;
      }
      if (typeof body.is_active === "boolean") {
        if (!isPlatformAdmin) {
          return NextResponse.json({ error: "Only platform admins can archive rooms" }, { status: 403 });
        }
        patch.is_active = body.is_active;
      }

      let update = admin.from("chat_rooms").update(patch).eq("id", room_id);
      const { data: updated, error: updErr } = await update.select().single();
      if (updErr) {
        // purpose column may not exist yet
        delete patch.purpose;
        const retry = await admin.from("chat_rooms").update(patch).eq("id", room_id).select().single();
        if (retry.error) throw retry.error;
        return NextResponse.json({ ...retry.data, ...(patch.purpose ? { purpose: patch.purpose } : {}) });
      }
      return NextResponse.json(updated);
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
