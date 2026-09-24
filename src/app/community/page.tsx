"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient, REALTIME_SUBSCRIBE_STATES, type RealtimeChannel } from "@supabase/supabase-js";
import {
  MessageCircle, Send, Users, Globe, Lock, Plus, Search, ArrowLeft,
  Sparkles, LogIn, X,
} from "lucide-react";
import {
  upsertRealtimeMessage,
  mergeUpdatedMessage,
  mergeServerMessages,
  reconcileSentMessage,
  toggleReactionInMetadata,
} from "@/components/chat/messageMerge";
import { MessageActions, ReactionPills } from "@/components/chat/MessageActions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Room {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_member?: boolean;
  unread_count?: number;
  member_count?: number;
  members?: { count: number };
  last_message?: string | null;
  last_message_at?: string | null;
}

interface ReplyTo {
  id: string;
  content: string;
  sender_id?: string;
}

interface RoomMetadata {
  reply_to?: ReplyTo;
  reactions?: Record<string, string[]>;
}

interface RoomMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  metadata?: RoomMetadata | null;
  is_deleted?: boolean;
}

const GRADIENTS: [string, string][] = [
  ["#a855f7", "#7c3aed"],
  ["#06b6d4", "#3b82f6"],
  ["#10b981", "#059669"],
  ["#f59e0b", "#ef4444"],
  ["#ec4899", "#a855f7"],
  ["#8b5cf6", "#06b6d4"],
];

function grad(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

function listTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((b - a) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

async function headers(): Promise<Record<string, string>> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) h["x-access-token"] = session.access_token;
  } catch {}
  return h;
}

export default function CommunityPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [rtStatus, setRtStatus] = useState<string>("connecting");
  const [openMsgId, setOpenMsgId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setUserId(s?.user?.id || null);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/global/rooms", { headers: await headers() });
      if (res.ok) {
        const data = await res.json();
        setRooms(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadRooms(); }, [loadRooms, userId]);
  useEffect(() => {
    const t = setInterval(loadRooms, 8000);
    return () => clearInterval(t);
  }, [loadRooms]);

  const openRoom = async (room: Room) => {
    setActiveRoom(room);
    setMessages([]);
    setOpenMsgId(null);
    setReplyTo(null);
    try {
      if (userId && !room.is_member && room.type === "public") {
        await fetch("/api/chat/global/rooms", {
          method: "PATCH",
          headers: await headers(),
          body: JSON.stringify({ room_id: room.id, action: "join" }),
        });
      }
      const res = await fetch(`/api/chat/global/messages?room_id=${room.id}&limit=80`, {
        headers: await headers(),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  // Realtime: inserts + updates (reactions/replies), with auto-resubscribe
  useEffect(() => {
    if (!activeRoom) return;

    let cancelled = false;
    let retries = 0;
    let channel: RealtimeChannel | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;
      setRtStatus("connecting");
      channel = supabase
        .channel(`web-global-${activeRoom.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "room_messages",
            filter: `room_id=eq.${activeRoom.id}`,
          },
          (payload) => {
            const msg = payload.new as RoomMessage;
            setMessages((prev) => upsertRealtimeMessage(prev, msg));
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "room_messages",
            filter: `room_id=eq.${activeRoom.id}`,
          },
          (payload) => {
            const msg = payload.new as RoomMessage;
            if (msg.is_deleted) {
              setMessages((prev) => prev.filter((m) => m.id !== msg.id));
            } else {
              setMessages((prev) => mergeUpdatedMessage(prev, msg));
            }
          }
        )
        .subscribe((status) => {
          if (cancelled) return;
          setRtStatus(status);
          if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
            retries = 0;
          } else if (
            status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
            status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT ||
            status === REALTIME_SUBSCRIBE_STATES.CLOSED
          ) {
            if (channel) {
              supabase.removeChannel(channel);
              channel = null;
            }
            const delay = Math.min(1000 * 2 ** retries, 15000);
            retries += 1;
            timer = setTimeout(connect, delay);
          }
        });
    };

    connect();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeRoom?.id]);

  // Poll fallback only while realtime is down
  useEffect(() => {
    if (!activeRoom || rtStatus === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) return;
    const roomId = activeRoom.id;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/global/messages?room_id=${roomId}&limit=80`, {
          headers: await headers(),
        });
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => mergeServerMessages(prev, data.messages || []));
        }
      } catch {}
    }, 5000);
    return () => clearInterval(poll);
  }, [activeRoom?.id, rtStatus]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const toggleReaction = async (msg: RoomMessage, emoji: string) => {
    if (!userId) {
      window.location.href = "/auth/login?next=/community";
      return;
    }
    const prevMeta = msg.metadata ?? null;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id ? { ...m, metadata: toggleReactionInMetadata(m.metadata, emoji, userId) } : m
      )
    );
    try {
      const res = await fetch("/api/chat/global/messages", {
        method: "POST",
        headers: await headers(),
        body: JSON.stringify({ action: "react", message_id: msg.id, emoji }),
      });
      if (!res.ok) throw new Error("react failed");
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => mergeUpdatedMessage(prev, data.message as RoomMessage));
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, metadata: prevMeta } : m))
      );
    }
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !activeRoom || sending) return;
    if (!userId) {
      window.location.href = "/auth/login?next=/community";
      return;
    }
    setSending(true);
    const replySnapshot = replyTo;
    setInput("");
    setReplyTo(null);

    const optimistic: RoomMessage = {
      id: `temp-${Date.now()}`,
      room_id: activeRoom.id,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
      metadata: replySnapshot ? { reply_to: replySnapshot } : undefined,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/chat/global/messages", {
        method: "POST",
        headers: await headers(),
        body: JSON.stringify({
          room_id: activeRoom.id,
          content,
          ...(replySnapshot ? { reply_to: replySnapshot } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const { message } = await res.json();
      if (message) {
        setMessages((prev) => reconcileSentMessage(prev, optimistic.id, message as RoomMessage));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(content);
      setReplyTo(replySnapshot);
    }
    setSending(false);
  };

  const createRoom = async () => {
    if (!newName.trim() || !userId) return;
    try {
      const res = await fetch("/api/chat/global/rooms", {
        method: "POST",
        headers: await headers(),
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      });
      if (res.ok) {
        const room = await res.json();
        setCreateOpen(false);
        setNewName("");
        setNewDesc("");
        await loadRooms();
        if (room?.id) openRoom(room);
      }
    } catch {}
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter(
      (r) => r.name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)
    );
  }, [rooms, search]);

  const items = useMemo(() => {
    const out: Array<
      | { kind: "day"; id: string; label: string }
      | { kind: "msg"; id: string; msg: RoomMessage; showName: boolean }
    > = [];
    let lastDay = "";
    let lastSender = "";
    let lastAt = 0;
    for (const msg of messages) {
      if (msg.is_deleted) continue;
      const day = dayLabel(msg.created_at);
      if (day !== lastDay) {
        out.push({ kind: "day", id: `d-${msg.id}`, label: day });
        lastDay = day;
        lastSender = "";
      }
      const at = new Date(msg.created_at).getTime();
      const consecutive = msg.sender_id === lastSender && at - lastAt < 3 * 60000;
      out.push({
        kind: "msg",
        id: msg.id,
        msg,
        showName: !consecutive && msg.sender_id !== userId,
      });
      lastSender = msg.sender_id;
      lastAt = at;
    }
    return out;
  }, [messages, userId]);

  if (!authReady) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)" }}>
        Loading community…
      </div>
    );
  }

  /* ── Thread view ── */
  if (activeRoom) {
    const [c1, c2] = grad(activeRoom.id);
    return (
      <div className="chat-thread">
        <div className="chat-header-glass">
          <button
            onClick={() => setActiveRoom(null)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 34, height: 34, borderRadius: 8, border: "none",
              background: "transparent", color: "var(--glow-purple)", cursor: "pointer",
            }}
            aria-label="Back to rooms"
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: "0.9375rem", flexShrink: 0,
          }}>
            {activeRoom.name[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{activeRoom.name}</div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
              {activeRoom.type === "public" ? <Globe size={10} /> : <Lock size={10} />}
              {activeRoom.member_count ?? activeRoom.members?.count ?? 0} members
              {activeRoom.type === "public" ? " · Public" : ""}
            </div>
          </div>
        </div>

        {activeRoom.description && (
          <div style={{
            display: "flex", gap: 6, padding: "0.5rem 1.25rem",
            background: "rgba(168,85,247,0.06)", borderBottom: "1px solid var(--border-subtle)",
            fontSize: "0.75rem", color: "var(--text-secondary)",
          }}>
            {activeRoom.description}
          </div>
        )}

        <div className="chat-scroll">
          {items.length === 0 ? (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: 8,
            }}>
              <MessageCircle size={36} style={{ opacity: 0.35 }} />
              <p style={{ fontWeight: 600 }}>Welcome to {activeRoom.name}</p>
              <p style={{ fontSize: "0.8125rem" }}>
                {userId ? "No messages yet — break the ice!" : "Sign in to chat. Anyone can read this public room."}
              </p>
            </div>
          ) : (
            items.map((item) => {
              if (item.kind === "day") {
                return (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, margin: "0.75rem 0" }}>
                    <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 600 }}>{item.label}</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                  </div>
                );
              }
              const mine = item.msg.sender_id === userId;
              const [m1, m2] = grad(item.msg.sender_id || "?");
              const reply = item.msg.metadata?.reply_to;
              return (
                <div
                  key={item.id}
                  style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setOpenMsgId((prev) => (prev === item.msg.id ? null : item.msg.id));
                  }}
                >
                  {!mine && (
                    <div style={{
                      width: 28, height: 28, borderRadius: 9,
                      background: `linear-gradient(135deg, ${m1}, ${m2})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: "0.625rem", fontWeight: 800, marginBottom: 16, flexShrink: 0,
                    }}>
                      {(item.msg.sender_id || "?").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                    {item.showName && !mine && (
                      <span className="chat-sender-name">
                        User_{item.msg.sender_id.slice(0, 4)}
                      </span>
                    )}
                    <div className={`chat-bubble chat-bubble-card${mine ? " chat-bubble-mine" : ""}`}>
                      {reply && (
                        <div className="chat-reply-quote">
                          <span className="chat-reply-quote-name">
                            {reply.sender_id ? `User_${reply.sender_id.slice(0, 4)}` : "Message"}
                          </span>
                          <span className="chat-reply-quote-text">{reply.content}</span>
                        </div>
                      )}
                      <div className="chat-bubble-text">{item.msg.content}</div>
                      <ReactionPills
                        reactions={item.msg.metadata?.reactions}
                        userId={userId}
                        onToggle={userId ? (emoji) => toggleReaction(item.msg, emoji) : undefined}
                      />
                      {userId && (
                        <MessageActions
                          open={openMsgId === item.msg.id}
                          onReact={(emoji) => toggleReaction(item.msg, emoji)}
                          onReply={() =>
                            setReplyTo({
                              id: item.msg.id,
                              content: item.msg.content,
                              sender_id: item.msg.sender_id,
                            })
                          }
                        />
                      )}
                    </div>
                    <span style={{
                      fontSize: "0.5625rem", marginTop: 3, color: "var(--text-muted)",
                      marginLeft: mine ? 0 : 4, marginRight: mine ? 4 : 0,
                    }}>
                      {new Date(item.msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {userId ? (
          <div className="chat-composer">
            {replyTo && (
              <div className="chat-reply-preview">
                <div className="chat-reply-preview-text">
                  <span className="chat-reply-preview-label">
                    Replying to {replyTo.sender_id ? `User_${replyTo.sender_id.slice(0, 4)}` : "message"}
                  </span>
                  <span className="chat-reply-preview-content">{replyTo.content}</span>
                </div>
                <button
                  className="chat-reply-preview-close"
                  onClick={() => setReplyTo(null)}
                  aria-label="Cancel reply"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="chat-composer-row">
              <textarea
                className="ambient-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={`Message ${activeRoom.name}...`}
                rows={1}
                style={{
                  flex: 1, resize: "none", fontSize: "0.8125rem",
                  padding: "0.625rem 0.875rem", borderRadius: "0.75rem",
                  maxHeight: 120, minHeight: 42, lineHeight: 1.4,
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className={`chat-send${input.trim() && !sending ? " chat-send-ready" : ""}`}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="chat-composer">
            <div className="chat-composer-bar">
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Sign in to join the conversation
              </span>
              <Link href="/auth/login?next=/community" className="glow-button" style={{
                display: "flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem",
                fontSize: "0.8125rem", textDecoration: "none",
              }}>
                <LogIn size={14} /> Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Rooms list ── */
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", paddingBottom: "3rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Community</h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Open space for buyers, sellers &amp; visitors
            </p>
          </div>
          <button
            onClick={() => {
              if (!userId) {
                window.location.href = "/auth/login?next=/community";
                return;
              }
              setCreateOpen(true);
            }}
            className="glow-button"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0.5rem 0.875rem", fontSize: "0.8125rem", border: "none", cursor: "pointer",
            }}
          >
            <Plus size={14} /> New room
          </button>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "0.75rem 1rem", borderRadius: 999,
          background: "rgba(168,85,247,0.06)", border: "1px solid var(--border-glow)",
          marginBottom: "1rem", fontSize: "0.75rem", color: "var(--text-secondary)",
        }}>
          <Sparkles size={14} style={{ color: "var(--glow-purple)", flexShrink: 0 }} />
          Free public space — drop in, say hi, get help, discover stores
        </div>

        <div style={{ position: "relative", marginBottom: "0.75rem" }}>
          <Search size={14} style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)",
          }} />
          <input
            className="ambient-input"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "0.625rem 0.75rem 0.625rem 2.25rem", fontSize: "0.8125rem", borderRadius: 999, boxSizing: "border-box" }}
          />
        </div>

        {!userId && (
          <div style={{
            padding: "0.75rem 1rem", borderRadius: "0.75rem", marginBottom: "0.75rem",
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
            fontSize: "0.75rem", color: "var(--glow-green)", fontWeight: 600, textAlign: "center",
          }}>
            <Link href="/auth/login?next=/community" style={{ color: "inherit" }}>
              Sign in to join rooms &amp; send messages
            </Link>
            {" · "}anyone can browse
          </div>
        )}

        <div style={{
          fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem",
        }}>
          Open rooms · {filtered.length}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "3rem 1.5rem",
            border: "1px solid var(--border-subtle)", borderRadius: "1rem",
            background: "var(--bg-card)",
          }}>
            <MessageCircle size={32} style={{ color: "var(--glow-purple)", margin: "0 auto 0.75rem" }} />
            <p style={{ fontWeight: 700 }}>{search ? "No rooms match" : "No rooms yet"}</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: 4 }}>
              {search ? "Try another search" : "Start the first public conversation"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filtered.map((room) => {
              const [c1, c2] = grad(room.id);
              const unread = room.unread_count || 0;
              const members = room.member_count ?? room.members?.count ?? 0;
              const preview =
                room.last_message || room.description || "Open to everyone";
              return (
                <button
                  key={room.id}
                  onClick={() => openRoom(room)}
                  className="ambient-card"
                  style={{
                    display: "flex", alignItems: "center", gap: "0.875rem",
                    padding: "1rem", cursor: "pointer", textAlign: "left",
                    border: unread > 0 ? "1px solid var(--border-glow)" : undefined,
                    background: unread > 0 ? "rgba(168,85,247,0.06)" : undefined,
                    width: "100%", fontFamily: "inherit", color: "inherit",
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `linear-gradient(135deg, ${c1}, ${c2})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 800, fontSize: "1.125rem", flexShrink: 0, position: "relative",
                  }}>
                    {room.name[0]?.toUpperCase()}
                    {room.type !== "public" && (
                      <span style={{
                        position: "absolute", right: -3, bottom: -3,
                        width: 16, height: 16, borderRadius: 8,
                        background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Lock size={8} />
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{
                        fontSize: "0.875rem", fontWeight: unread > 0 ? 800 : 700,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {room.name}
                      </span>
                      <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", flexShrink: 0 }}>
                        {listTime(room.last_message_at)}
                      </span>
                    </div>
                    <div style={{
                      fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 3,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {preview}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: "0.625rem", color: "var(--text-muted)",
                        padding: "2px 7px", borderRadius: 999,
                        background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
                      }}>
                        <Users size={9} /> {members}
                      </span>
                      {room.type === "public" && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: "0.625rem", color: "var(--glow-green)",
                          padding: "2px 7px", borderRadius: 999,
                          background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)",
                        }}>
                          <Globe size={9} /> Public
                        </span>
                      )}
                      {room.is_member && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: "0.625rem", color: "var(--glow-purple)",
                          padding: "2px 7px", borderRadius: 999,
                          background: "rgba(168,85,247,0.12)",
                        }}>
                          <MessageCircle size={9} /> Joined
                        </span>
                      )}
                    </div>
                  </div>
                  {unread > 0 && (
                    <span style={{
                      minWidth: 20, height: 20, borderRadius: 10,
                      background: "var(--glow-purple)", color: "#fff",
                      fontSize: "0.6875rem", fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 6px", flexShrink: 0,
                    }}>
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Create room modal */}
      {createOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100,
        }} onClick={() => setCreateOpen(false)}>
          <div
            className="ambient-card"
            style={{
              width: "min(440px, 100%)", padding: "1.5rem",
              borderRadius: "1.25rem 1.25rem 0 0",
              display: "flex", flexDirection: "column", gap: "0.75rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800 }}>New public room</h2>
              <button
                onClick={() => setCreateOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Room name
            </label>
            <input
              className="ambient-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Deals & Drops"
              maxLength={40}
              style={{ padding: "0.75rem", fontSize: "0.875rem", borderRadius: "0.75rem" }}
            />
            <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Description (optional)
            </label>
            <textarea
              className="ambient-input"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="What is this room about?"
              maxLength={140}
              rows={3}
              style={{ padding: "0.75rem", fontSize: "0.875rem", borderRadius: "0.75rem", resize: "none" }}
            />
            <button
              className="glow-button"
              onClick={createRoom}
              disabled={!newName.trim()}
              style={{
                padding: "0.75rem", fontSize: "0.875rem", fontWeight: 700,
                opacity: newName.trim() ? 1 : 0.5, cursor: newName.trim() ? "pointer" : "default",
                border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Send size={14} /> Create room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
