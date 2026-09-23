import { supabase } from "./supabase";
import { WEB_API_URL } from "./config";

export type Room = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_member?: boolean;
  role?: string;
  unread_count?: number;
  member_count?: number;
  members?: { count: number };
  last_message?: string | null;
  last_message_at?: string | null;
  last_sender_id?: string | null;
};

export type RoomMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
};

export type RoomDetail = {
  room: Room;
  member: boolean;
  role: string;
  messages: RoomMessage[];
  unread_count: number;
  member_count: number;
  can_send: boolean;
  sender_ids: string[];
};

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers["x-access-token"] = session.access_token;
  } catch {}
  return headers;
}

export async function fetchRooms(): Promise<Room[]> {
  try {
    const headers = await authHeaders();
    const res = await fetch(`${WEB_API_URL}/api/chat/global/rooms`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchRoomDetail(roomId: string): Promise<RoomDetail | null> {
  try {
    const headers = await authHeaders();
    const res = await fetch(
      `${WEB_API_URL}/api/chat/global/rooms?room_id=${encodeURIComponent(roomId)}`,
      { headers }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchRoomMessages(
  roomId: string,
  before?: string
): Promise<RoomMessage[]> {
  try {
    const headers = await authHeaders();
    const qs = new URLSearchParams({ room_id: roomId, limit: "80" });
    if (before) qs.set("before", before);
    const res = await fetch(`${WEB_API_URL}/api/chat/global/messages?${qs}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  } catch {
    return [];
  }
}

export async function sendRoomMessage(
  roomId: string,
  content: string
): Promise<RoomMessage | null> {
  try {
    const headers = await authHeaders();
    const res = await fetch(`${WEB_API_URL}/api/chat/global/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ room_id: roomId, content }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.message || null;
  } catch {
    return null;
  }
}

export async function joinRoom(roomId: string): Promise<boolean> {
  try {
    const headers = await authHeaders();
    const res = await fetch(`${WEB_API_URL}/api/chat/global/rooms`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ room_id: roomId, action: "join" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function leaveRoom(roomId: string): Promise<boolean> {
  try {
    const headers = await authHeaders();
    const res = await fetch(`${WEB_API_URL}/api/chat/global/rooms`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ room_id: roomId, action: "leave" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function createRoom(
  name: string,
  description?: string
): Promise<Room | null> {
  try {
    const headers = await authHeaders();
    const res = await fetch(`${WEB_API_URL}/api/chat/global/rooms`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name, description, type: "public" }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
