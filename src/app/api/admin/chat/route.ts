import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/api";

const admin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

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

async function requireAdmin(request: NextRequest) {
  const user = await resolveUser(request);
  if (!user || !ADMIN_IDS.includes(user.id)) return null;
  return user;
}

/**
 * GET /api/admin/chat — list rooms + recent messages for the admin chat control center.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: rooms, error: roomErr } = await admin
      .from("chat_rooms")
      .select("*")
      .order("created_at", { ascending: false });
    if (roomErr) throw roomErr;

    const roomId = new URL(request.url).searchParams.get("room_id");
    let messages: any[] = [];
    if (roomId) {
      const { data: msgs } = await admin
        .from("room_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(100);
      messages = msgs || [];
    }

    const counts = await Promise.all(
      (rooms || []).map(async (room) => {
        let count = 0;
        try {
          const withFilter = await admin
            .from("room_messages")
            .select("id", { count: "exact", head: true })
            .eq("room_id", room.id)
            .eq("is_deleted", false);
          if (!withFilter.error) {
            count = withFilter.count || 0;
          } else {
            const withoutFilter = await admin
              .from("room_messages")
              .select("id", { count: "exact", head: true })
              .eq("room_id", room.id);
            count = withoutFilter.count || 0;
          }
        } catch {}
        const { count: members } = await admin
          .from("room_members")
          .select("id", { count: "exact", head: true })
          .eq("room_id", room.id);
        return { id: room.id, message_count: count || 0, member_count: members || 0 };
      })
    );

    return NextResponse.json({ rooms: rooms || [], messages, counts });
  } catch (err) {
    console.error("[admin-chat] GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/chat — soft-delete (remove spam) a room message.
 * Body: { message_id }
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { message_id } = await request.json();
    if (!message_id) return NextResponse.json({ error: "message_id required" }, { status: 400 });

    const { data, error } = await admin
      .from("room_messages")
      .update({
        is_deleted: true,
        deleted_by: user.id,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", message_id)
      .select()
      .single();

    if (error) {
      // is_deleted column missing — hard delete as fallback
      const { error: delErr } = await admin.from("room_messages").delete().eq("id", message_id);
      if (delErr) throw delErr;
      return NextResponse.json({ ok: true, hard_deleted: true });
    }

    return NextResponse.json({ ok: true, message: data });
  } catch (err) {
    console.error("[admin-chat] DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/chat — update room (purpose / visibility / archive).
 * Body: { room_id, purpose?, type?, is_active?, name?, description? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { room_id } = body;
    if (!room_id) return NextResponse.json({ error: "room_id required" }, { status: 400 });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim().slice(0, 80);
    if (typeof body.description === "string") patch.description = body.description.trim().slice(0, 500) || null;
    if (["general", "support", "announcements"].includes(body.purpose)) patch.purpose = body.purpose;
    if (["public", "private", "admin"].includes(body.type)) patch.type = body.type;
    if (typeof body.is_active === "boolean") patch.is_active = body.is_active;

    const { data: updated, error } = await admin
      .from("chat_rooms")
      .update(patch)
      .eq("id", room_id)
      .select()
      .single();

    if (error) {
      delete patch.purpose;
      const retry = await admin
        .from("chat_rooms")
        .update(patch)
        .eq("id", room_id)
        .select()
        .single();
      if (retry.error) throw retry.error;
      return NextResponse.json(retry.data);
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[admin-chat] PATCH error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
