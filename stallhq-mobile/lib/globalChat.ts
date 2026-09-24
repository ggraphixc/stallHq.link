import { supabase } from "./supabase";
import { WEB_API_URL } from "./config";
import { File } from "expo-file-system";

export type Room = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  purpose?: string;
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

export type ReplyPayload = {
  id: string;
  sender_id: string;
  preview: string;
};

export type RoomMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
  reply_to?: string | null;
  read_by?: string[] | null;
  is_deleted?: boolean;
  deleted_by?: string | null;
  deleted_at?: string | null;
  pending?: boolean;
  failed?: boolean;
};

export type RoomDetail = {
  room: Room;
  member: boolean;
  role: string;
  can_manage?: boolean;
  messages: RoomMessage[];
  unread_count: number;
  member_count: number;
  can_send: boolean;
  sender_ids: string[];
};

export type DmMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  read_at: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
  pending?: boolean;
  failed?: boolean;
};

export type MessageReaction = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at?: string;
};

export type ReactionSummary = Record<string, { emoji: string; userIds: string[] }[]>;

export type TypingPeer = {
  userId: string;
  typing: boolean;
  at?: number;
};

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers["x-access-token"] = session.access_token;
  } catch {}
  return headers;
}

// ─── Reply codec (fallback when reply_to / metadata columns are missing) ─

const REPLY_SEP = "\u2063";
const RE_REPLY = new RegExp(
  `^${REPLY_SEP}reply${REPLY_SEP}([^${REPLY_SEP}]+)${REPLY_SEP}([^${REPLY_SEP}]*)${REPLY_SEP}([^${REPLY_SEP}]*)${REPLY_SEP}\\n`
);

function encodeReply(reply: ReplyPayload): string {
  return (
    `${REPLY_SEP}reply${REPLY_SEP}${reply.id}${REPLY_SEP}${reply.sender_id || ""}` +
    `${REPLY_SEP}${encodeURIComponent(reply.preview.slice(0, 120))}${REPLY_SEP}\n`
  );
}

export function decodeMessageContent(content: string): {
  text: string;
  reply?: ReplyPayload;
} {
  const m = RE_REPLY.exec(content);
  if (!m) return { text: content };
  try {
    return {
      text: content.slice(m[0].length),
      reply: {
        id: m[1],
        sender_id: m[2],
        preview: decodeURIComponent(m[3] || ""),
      },
    };
  } catch {
    return { text: content };
  }
}

export function extractReply(
  msg: RoomMessage | DmMessage | null | undefined
): ReplyPayload | null {
  if (!msg) return null;
  const meta = msg.metadata as { reply_to?: ReplyPayload } | null | undefined;
  if (meta?.reply_to?.id) {
    return meta.reply_to;
  }
  const room = msg as RoomMessage;
  if (room.reply_to) {
    return {
      id: room.reply_to,
      sender_id: meta?.reply_to?.sender_id || "",
      preview: meta?.reply_to?.preview || "",
    };
  }
  const decoded = decodeMessageContent(msg.content);
  return decoded.reply || null;
}

export function displayContent(content: string): string {
  return decodeMessageContent(content).text;
}

/** True when the message was deleted for everyone (content was blanked out). */
export function isDeletedForEveryone(
  msg: { content?: string | null; metadata?: Record<string, unknown> | null }
): boolean {
  const meta = msg.metadata as { deleted_for_everyone?: boolean } | null | undefined;
  return meta?.deleted_for_everyone === true;
}

export function isImageUrl(content: string): boolean {
  const text = displayContent(content).trim();
  if (!/^https?:\/\//i.test(text)) return false;
  return /\.(png|jpe?g|webp|gif|avif)(\?|#|$)/i.test(text);
}

// ─── Capability probes (cached) ─────────────────────────────────────────

let roomReplyCol: boolean | null = null;
let dmMetaCol: boolean | null = null;

async function roomSupportsReplyColumn(): Promise<boolean> {
  if (roomReplyCol !== null) return roomReplyCol;
  try {
    const { error } = await supabase.from("room_messages").select("reply_to").limit(1);
    roomReplyCol = !error;
  } catch {
    roomReplyCol = false;
  }
  return roomReplyCol;
}

async function dmSupportsMetadata(): Promise<boolean> {
  if (dmMetaCol !== null) return dmMetaCol;
  try {
    const { error } = await supabase.from("messages").select("metadata").limit(1);
    dmMetaCol = !error;
  } catch {
    dmMetaCol = false;
  }
  return dmMetaCol;
}

// ─── Merge / dedupe helpers ─────────────────────────────────────────────

function isTempId(id: string): boolean {
  return id.startsWith("tmp-") || id.startsWith("temp-");
}

export function upsertMessage<T extends { id: string; content: string; sender_id: string; created_at: string; pending?: boolean }>(
  list: T[],
  msg: T
): T[] {
  const existingIdx = list.findIndex((m) => m.id === msg.id);
  if (existingIdx >= 0) {
    const next = list.slice();
    next[existingIdx] = { ...next[existingIdx], ...msg };
    return next;
  }
  const pendingIdx = list.findIndex(
    (m) =>
      m.pending &&
      !isTempId(msg.id) &&
      m.sender_id === msg.sender_id &&
      Math.abs(new Date(m.created_at).getTime() - new Date(msg.created_at).getTime()) < 20000
  );
  if (pendingIdx >= 0) {
    const next = list.slice();
    next[pendingIdx] = msg;
    return next;
  }
  return [...list, msg].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export function mergeMessageList<T extends { id: string; content: string; sender_id: string; created_at: string; read_at?: string | null; read_by?: string[] | null }>(
  prev: T[],
  incoming: T[]
): T[] {
  let out = prev;
  for (const msg of incoming) {
    out = upsertMessage(out, msg);
  }
  return out;
}

// ─── Rooms API ──────────────────────────────────────────────────────────

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
  content: string,
  opts?: {
    message_type?: "text" | "image" | "file";
    replyTo?: ReplyPayload;
  }
): Promise<RoomMessage | null> {
  let body = content;
  const message_type = opts?.message_type || "text";
  const reply = opts?.replyTo;
  let useColumn = false;

  if (reply) {
    useColumn = await roomSupportsReplyColumn();
    if (!useColumn) body = encodeReply(reply) + content;
  }

  try {
    const headers = await authHeaders();
    const res = await fetch(`${WEB_API_URL}/api/chat/global/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ room_id: roomId, content: body, message_type }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const saved: RoomMessage | null = data.message || null;
    if (!saved) return null;

    if (reply && useColumn) {
      const metadata = { ...(saved.metadata || {}), reply_to: reply };
      try {
        const { data: updated, error } = await supabase
          .from("room_messages")
          .update({ reply_to: reply.id, metadata })
          .eq("id", saved.id)
          .select()
          .single();
        if (!error && updated) return { ...saved, ...updated };
      } catch {}
      return { ...saved, metadata, reply_to: reply.id };
    }
    return saved;
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

/** Update room settings. Requires room admin/moderator or platform admin. */
export async function updateRoomSettings(
  roomId: string,
  patch: { name?: string; description?: string; purpose?: string; type?: string; is_active?: boolean }
): Promise<Room | null> {
  try {
    const headers = await authHeaders();
    const res = await fetch(`${WEB_API_URL}/api/chat/global/rooms`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ room_id: roomId, action: "settings", ...patch }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Read receipts ──────────────────────────────────────────────────────

export async function markRoomRead(roomId: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase
      .from("room_notifications")
      .update({
        last_read_at: new Date().toISOString(),
        unread_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("room_id", roomId)
      .eq("user_id", session.user.id);
  } catch {}
}

/** Best-effort: stamp our uid into read_by so senders can see ✓✓. */
export async function markRoomMessagesSeen(
  messages: RoomMessage[],
  userId: string
): Promise<void> {
  if (!userId) return;
  try {
    const targets = messages
      .filter(
        (m) =>
          m.sender_id &&
          m.sender_id !== userId &&
          !isTempId(m.id) &&
          !(m.read_by || []).includes(userId)
      )
      .slice(-25);
    for (const m of targets) {
      const next = Array.from(new Set([...(m.read_by || []), userId]));
      await supabase.from("room_messages").update({ read_by: next }).eq("id", m.id);
    }
  } catch {}
}

// ─── Soft delete (rooms) ────────────────────────────────────────────────

export async function softDeleteRoomMessage(
  messageId: string,
  userId: string
): Promise<boolean> {
  if (!userId || !messageId || isTempId(messageId)) return false;
  try {
    const { error } = await supabase
      .from("room_messages")
      .update({
        is_deleted: true,
        deleted_by: userId,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .eq("sender_id", userId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * DM delete-for-everyone: blank the body and flag the metadata so every
 * client renders the muted "This message was deleted" bubble.
 * Returns false when the row (or the metadata column) can't be updated.
 */
export async function softDeleteDmMessage(msg: DmMessage): Promise<boolean> {
  if (!msg?.id || isTempId(msg.id)) return false;
  try {
    const metadata = { ...(msg.metadata || {}), deleted_for_everyone: true };
    const { data, error } = await supabase
      .from("messages")
      .update({ content: "", metadata })
      .eq("id", msg.id)
      .select("id");
    if (error) return false;
    return !!data && data.length > 0;
  } catch {
    return false;
  }
}

// ─── Reactions ──────────────────────────────────────────────────────────

export async function fetchReactions(
  messageIds: string[]
): Promise<ReactionSummary> {
  const map: ReactionSummary = {};
  if (!messageIds.length) return map;
  try {
    const ids = messageIds.filter((id) => !isTempId(id)).slice(0, 200);
    if (!ids.length) return map;
    const { data, error } = await supabase
      .from("message_reactions")
      .select("*")
      .in("message_id", ids);
    if (error || !data) return map;
    for (const r of data as MessageReaction[]) {
      if (!map[r.message_id]) map[r.message_id] = [];
      let entry = map[r.message_id].find((e) => e.emoji === r.emoji);
      if (!entry) {
        entry = { emoji: r.emoji, userIds: [] };
        map[r.message_id].push(entry);
      }
      if (!entry.userIds.includes(r.user_id)) entry.userIds.push(r.user_id);
    }
  } catch {}
  return map;
}

export function reactionsFromMetadata(
  msg: RoomMessage | DmMessage
): ReactionSummary {
  const map: ReactionSummary = {};
  const meta = msg.metadata as Record<string, unknown> | null;
  const raw = meta?.reactions;
  const entries: { user_id: string; emoji: string }[] = [];

  if (Array.isArray(raw)) {
    for (const r of raw as { user_id?: string; emoji?: string }[]) {
      if (r?.user_id && r?.emoji) entries.push({ user_id: r.user_id, emoji: r.emoji });
    }
  } else if (raw && typeof raw === "object") {
    // Web format: Record<emoji, userId[]>
    for (const [emoji, userIds] of Object.entries(raw as Record<string, unknown>)) {
      if (!Array.isArray(userIds)) continue;
      for (const uid of userIds) {
        if (typeof uid === "string") entries.push({ user_id: uid, emoji });
      }
    }
  }

  for (const r of entries) {
    if (!map[msg.id]) map[msg.id] = [];
    let entry = map[msg.id].find((e) => e.emoji === r.emoji);
    if (!entry) {
      entry = { emoji: r.emoji, userIds: [] };
      map[msg.id].push(entry);
    }
    if (!entry.userIds.includes(r.user_id)) entry.userIds.push(r.user_id);
  }
  return map;
}

export function mergeReactionSummaries(
  a: ReactionSummary,
  b: ReactionSummary
): ReactionSummary {
  const out: ReactionSummary = { ...a };
  for (const [mid, entries] of Object.entries(b)) {
    const existing = out[mid] ? out[mid].slice() : [];
    for (const e of entries) {
      const hit = existing.find((x) => x.emoji === e.emoji);
      if (hit) {
        hit.userIds = Array.from(new Set([...hit.userIds, ...e.userIds]));
      } else {
        existing.push({ emoji: e.emoji, userIds: [...e.userIds] });
      }
    }
    out[mid] = existing;
  }
  return out;
}

export async function toggleMessageReaction(
  messageId: string,
  emoji: string,
  userId: string,
  opts?: { table?: "room_messages" | "messages" }
): Promise<"added" | "removed" | "failed"> {
  if (!userId || isTempId(messageId)) return "failed";

  try {
    const { data: existing, error } = await supabase
      .from("message_reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji);
    if (!error) {
      if (existing?.length) {
        const { error: delErr } = await supabase
          .from("message_reactions")
          .delete()
          .eq("id", existing[0].id);
        if (!delErr) return "removed";
      } else {
        const { error: insErr } = await supabase
          .from("message_reactions")
          .insert({ message_id: messageId, user_id: userId, emoji });
        if (!insErr) return "added";
      }
    }
  } catch {}

  if (opts?.table === "room_messages") {
    try {
      const { data: row, error } = await supabase
        .from("room_messages")
        .select("metadata")
        .eq("id", messageId)
        .single();
      if (!error && row) {
        const meta = ((row as { metadata?: Record<string, unknown> }).metadata || {}) as {
          reactions?: Record<string, string[]> | { user_id: string; emoji: string }[];
        };
        // Normalize to web format: Record<emoji, userId[]>
        let reactions: Record<string, string[]> = {};
        if (Array.isArray(meta.reactions)) {
          for (const r of meta.reactions) {
            if (!reactions[r.emoji]) reactions[r.emoji] = [];
            if (!reactions[r.emoji].includes(r.user_id)) reactions[r.emoji].push(r.user_id);
          }
        } else if (meta.reactions && typeof meta.reactions === "object") {
          reactions = { ...(meta.reactions as Record<string, string[]>) };
        }
        const list = reactions[emoji] ? [...reactions[emoji]] : [];
        const at = list.indexOf(userId);
        let removed = false;
        if (at >= 0) {
          list.splice(at, 1);
          removed = true;
        } else {
          list.push(userId);
        }
        if (list.length) reactions[emoji] = list;
        else delete reactions[emoji];
        const { error: updErr } = await supabase
          .from("room_messages")
          .update({ metadata: { ...meta, reactions } })
          .eq("id", messageId);
        if (!updErr) return removed ? "removed" : "added";
      }
    } catch {}
  }

  return "failed";
}

// ─── DM reply metadata (after HTTP send) ────────────────────────────────

export async function attachDmReply(
  messageId: string,
  reply: ReplyPayload
): Promise<DmMessage | null> {
  const supported = await dmSupportsMetadata();
  if (!supported) return null;
  try {
    const { data, error } = await supabase
      .from("messages")
      .update({ metadata: { reply_to: reply } })
      .eq("id", messageId)
      .select()
      .single();
    if (error || !data) return null;
    return data as DmMessage;
  } catch {
    return null;
  }
}

export function needsDmReplyPrefix(): Promise<boolean> {
  return dmSupportsMetadata().then((ok) => !ok);
}

export function encodeDmSendContent(content: string, reply?: ReplyPayload): string {
  if (!reply) return content;
  return encodeReply(reply) + content;
}

// ─── Resilient realtime ─────────────────────────────────────────────────

type RealtimeStatus =
  | "SUBSCRIBED"
  | "CHANNEL_ERROR"
  | "TIMED_OUT"
  | "CLOSED"
  | "JOINING_CHANNEL"
  | "TRANSPORT_CLOSED";

export type ResilientSubscription = {
  destroy: () => void;
  isConnected: () => boolean;
};

export function subscribeResilient(opts: {
  name: string;
  table: string;
  filter?: string;
  events?: Array<"INSERT" | "UPDATE" | "DELETE">;
  onRow: (event: "INSERT" | "UPDATE" | "DELETE", row: Record<string, unknown>) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}): ResilientSubscription {
  let stopped = false;
  let connected = false;
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  const events = opts.events ?? ["INSERT", "UPDATE"];

  const attach = () => {
    if (stopped) return;
    const name = attempt === 0 ? opts.name : `${opts.name}-r${attempt}`;
    let ch = supabase.channel(name);
    for (const ev of events) {
      ch = ch.on(
        "postgres_changes",
        {
          event: ev,
          schema: "public",
          table: opts.table,
          ...(opts.filter ? { filter: opts.filter } : {}),
        },
        (payload) => {
          opts.onRow(ev, payload.new as Record<string, unknown>);
        }
      );
    }
    channel = ch;
    ch.subscribe((status: RealtimeStatus) => {
      if (stopped) return;
      if (status === "SUBSCRIBED") {
        connected = true;
        attempt = 0;
        opts.onConnected?.();
        return;
      }
      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED" ||
        status === "TRANSPORT_CLOSED"
      ) {
        const wasConnected = connected;
        connected = false;
        if (wasConnected) opts.onDisconnected?.();
        const delay = Math.min(1000 * 2 ** Math.min(attempt, 5), 30000);
        attempt += 1;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (stopped) return;
          if (channel) {
            try {
              supabase.removeChannel(channel);
            } catch {}
            channel = null;
          }
          attach();
        }, delay);
      }
    });
  };

  attach();

  return {
    destroy() {
      stopped = true;
      connected = false;
      if (timer) clearTimeout(timer);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
        channel = null;
      }
    },
    isConnected: () => connected,
  };
}

/**
 * Shared poll tick: every 3s. When disconnected, poll every tick;
 * when connected, poll every 5th tick (~15s) as a catch-up safety net.
 */
export function startChatPoll(
  onTick: () => void,
  isConnected: () => boolean,
  intervalMs = 3000
): () => void {
  let ticks = 0;
  const id = setInterval(() => {
    ticks += 1;
    if (!isConnected() || ticks % 5 === 0) {
      try {
        onTick();
      } catch {}
    }
  }, intervalMs);
  return () => clearInterval(id);
}

// ─── Typing presence ────────────────────────────────────────────────────

export function createTypingChannel(
  channelName: string,
  onUpdate: (peers: TypingPeer[]) => void
): {
  setTyping: (userId: string, typing: boolean) => void;
  destroy: () => void;
} {
  const ch = supabase.channel(channelName);
  const emit = () => {
    try {
      const state = ch.presenceState<TypingPeer>();
      const peers: TypingPeer[] = [];
      for (const key of Object.keys(state)) {
        for (const p of state[key] || []) {
          if (p && p.userId) peers.push(p);
        }
      }
      onUpdate(peers);
    } catch {}
  };
  try {
    ch.on("presence", { event: "sync" }, emit);
    ch.subscribe();
  } catch {}

  return {
    setTyping(userId: string, typing: boolean) {
      try {
        ch.track({ userId, typing, at: Date.now() } as TypingPeer);
      } catch {}
    },
    destroy() {
      try {
        supabase.removeChannel(ch);
      } catch {}
    },
  };
}

export function activeTypers(
  peers: TypingPeer[],
  selfId: string | undefined,
  maxAgeMs = 7000
): string[] {
  const now = Date.now();
  const seen = new Set<string>();
  for (const p of peers) {
    if (!p.typing) continue;
    if (selfId && p.userId === selfId) continue;
    if (p.at && now - p.at > maxAgeMs) continue;
    seen.add(p.userId);
  }
  return Array.from(seen);
}

// ─── Image upload ───────────────────────────────────────────────────────

/**
 * Read a picked image as bytes for upload.
 * `fetch(uri).blob()` fails on some Android devices, so expo-file-system is
 * the primary path and the blob fetch is only a fallback.
 */
async function readChatImageBody(uri: string): Promise<ArrayBuffer | Blob> {
  try {
    const file = new File(uri);
    const bytes = await file.bytes();
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    );
    return buffer;
  } catch (e) {
    console.warn("[chat] file-system read failed, falling back to blob", e);
  }
  const res = await fetch(uri);
  return res.blob();
}

export async function uploadChatImage(uri: string): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id || "anon";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const body = await readChatImageBody(uri);
    const { error } = await supabase.storage.from("chat-images").upload(path, body, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (error) {
      console.error("[chat] upload failed", error);
      return null;
    }
    const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (error) {
    console.error("[chat] upload failed", error);
    return null;
  }
}
