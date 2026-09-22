import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const admin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/chat/global/rooms
 * List all active chat rooms with membership status.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("room_id");

    if (roomId) {
      // Get single room with messages and membership
      const { data: room } = await admin
        .from("chat_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

      // Check membership
      const { data: member } = await admin
        .from("room_members")
        .select("*")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

      if (!member && room.type !== "public") {
        return NextResponse.json({ error: "Not a member" }, { status: 403 });
      }

      // Get messages
      const { data: messages } = await admin
        .from("room_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      // Get unread count
      const { data: notif } = await admin
        .from("room_notifications")
        .select("unread_count, last_read_at")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

      return NextResponse.json({
        room,
        member: !!member,
        role: member?.role || "member",
        messages: messages || [],
        unread_count: notif?.unread_count || 0,
      });
    }

    // List all rooms
    const { data: rooms } = await admin
      .from("chat_rooms")
      .select(`
        *,
        members:room_members(count),
        notifications:room_notifications(unread_count)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // Add membership status for each room
    const enriched = await Promise.all(
      (rooms || []).map(async (room: any) => {
        const { data: member } = await admin
          .from("room_members")
          .select("*")
          .eq("room_id", room.id)
          .eq("user_id", user.id)
          .single();
        return {
          ...room,
          is_member: !!member,
          role: member?.role || "member",
          unread_count: member ? (await admin.from("room_notifications").select("unread_count").eq("room_id", room.id).eq("user_id", user.id).single()).data?.unread_count || 0 : 0,
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
 * POST /api/chat/global/rooms
 * Create a new chat room.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description, type } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Room name required" }, { status: 400 });
    }

    // Check if user is admin
    const isAdmin = user.id === (process.env.ADMIN_USER_ID || "").split(",")[0]?.trim();
    const roomType = isAdmin ? (type || "public") : "public";

    const { data: room, error } = await admin
      .from("chat_rooms")
      .insert({ name: name.trim(), description: description?.trim(), type: roomType, created_by: user.id })
      .select()
      .single();

    if (error) throw error;

    // Add creator as admin member
    await admin.from("room_members").insert({ room_id: room.id, user_id: user.id, role: isAdmin ? "admin" : "member" });

    // Create notification entry
    await admin.from("room_notifications").insert({ room_id: room.id, user_id: user.id });

    // Add all users to public rooms
    if (roomType === "public") {
      const { data: allUsers } = await supabase.auth.admin.listUsers();
      const members = (allUsers?.users || []).map((u: any) => ({
        room_id: room.id,
        user_id: u.id,
        role: "member",
      }));
      await admin.from("room_members").insert(members);
      await admin.from("room_notifications").insert(
        (allUsers?.users || []).map((u: any) => ({ room_id: room.id, user_id: u.id }))
      );
    }

    return NextResponse.json(room, { status: 201 });
  } catch (err) {
    console.error("[global-chat] POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
