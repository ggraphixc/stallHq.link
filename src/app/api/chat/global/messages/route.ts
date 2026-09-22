import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const admin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/chat/global/messages?room_id=xxx
 * Get messages for a room, with pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("room_id");
    const before = searchParams.get("before");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!roomId) return NextResponse.json({ error: "room_id required" }, { status: 400 });

    // Check membership
    const { data: member } = await admin
      .from("room_members")
      .select("*")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .single();

    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

    let query = admin
      .from("room_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (before) query = query.lt("created_at", before);
    query = query.limit(limit);

    const { data: messages } = await query;

    // Mark messages as read
    const unreadMsgs = (messages || []).filter((m: any) => !m.read_by?.includes(user.id));
    if (unreadMsgs.length > 0) {
      await admin
        .from("room_messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadMsgs.map((m: any) => m.id));

      // Update unread count
      const { data: notif } = await admin
        .from("room_notifications")
        .select("unread_count")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

      if (notif) {
        await admin
          .from("room_notifications")
          .update({ unread_count: 0, last_read_at: new Date().toISOString() })
          .eq("room_id", roomId)
          .eq("user_id", user.id);
      }
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (err) {
    console.error("[global-chat messages] GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * POST /api/chat/global/messages
 * Send a new message to a room.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { room_id, content, message_type } = body;

    if (!room_id || !content?.trim()) {
      return NextResponse.json({ error: "room_id and content required" }, { status: 400 });
    }

    // Check membership
    const { data: member } = await admin
      .from("room_members")
      .select("*")
      .eq("room_id", room_id)
      .eq("user_id", user.id)
      .single();

    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

    // Get room type to check if admin-only
    const { data: room } = await admin.from("chat_rooms").select("type").eq("id", room_id).single();
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const { data: msg, error } = await admin
      .from("room_messages")
      .insert({
        room_id,
        sender_id: user.id,
        content: content.trim(),
        message_type: message_type || "text",
      })
      .select()
      .single();

    if (error) throw error;

    // Update unread count for all room members except sender
    const { data: members } = await admin
      .from("room_members")
      .select("user_id")
      .eq("room_id", room_id);

    if (members) {
      const updates = members
        .filter((m: any) => m.user_id !== user.id)
        .map((m: any) => ({
          room_id,
          user_id: m.user_id,
          unread_count: 1,
          updated_at: new Date().toISOString(),
        }));

      for (const u of updates) {
        const { data: existing } = await admin
          .from("room_notifications")
          .select("unread_count")
          .eq("room_id", u.room_id)
          .eq("user_id", u.user_id)
          .single();

        const newCount = (existing?.unread_count || 0) + 1;
        await admin
          .from("room_notifications")
          .update({ unread_count: newCount, updated_at: new Date().toISOString() })
          .eq("room_id", u.room_id)
          .eq("user_id", u.user_id);
      }
    }

    return NextResponse.json({ message: msg });
  } catch (err) {
    console.error("[global-chat messages] POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
