"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageCircle, Users, Trash2, RefreshCw, Globe, Lock, Megaphone,
  Shield, Archive, Info, CheckCircle,
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  description: string | null;
  type: string;
  purpose?: string;
  is_active: boolean;
  created_at: string;
}

interface RoomMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  is_deleted?: boolean;
  created_at: string;
}

interface CountRow {
  id: string;
  message_count: number;
  member_count: number;
}

const PURPOSES = [
  { value: "general", label: "General", desc: "Free discussion" },
  { value: "support", label: "Support", desc: "Help & reports only" },
  { value: "announcements", label: "Announcements", desc: "Admin-authored only" },
];

export default function ChatControlCenter() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [counts, setCounts] = useState<CountRow[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async (roomId?: string | null) => {
    setLoading(true);
    try {
      const qs = roomId ? `?room_id=${encodeURIComponent(roomId)}` : "";
      const res = await fetch(`/api/admin/chat${qs}`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
        setCounts(data.counts || []);
        if (roomId) setMessages(data.messages || []);
        else setMessages([]);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(selectedRoom); }, [load, selectedRoom]);

  const updateRoom = async (roomId: string, patch: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, ...patch }),
      });
      if (res.ok) {
        flash("Room updated");
        await load(selectedRoom);
      } else {
        const d = await res.json().catch(() => ({}));
        flash(d.error || "Update failed");
      }
    } catch {
      flash("Network error");
    }
    setBusy(false);
  };

  const deleteMessage = async (messageId: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: messageId }),
      });
      if (res.ok) {
        flash("Message removed");
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, is_deleted: true } : m))
        );
      } else {
        flash("Failed to remove message");
      }
    } catch {
      flash("Network error");
    }
    setBusy(false);
  };

  const countFor = (id: string) => counts.find((c) => c.id === id);

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1200 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <MessageCircle size={22} style={{ color: "var(--glow-purple)" }} />
            Chat Control Center
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: 4 }}>
            Manage rooms, purposes, visibility, and remove spam messages
          </p>
        </div>
        <button
          onClick={() => load(selectedRoom)}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "0.5rem 0.875rem", borderRadius: 8,
            border: "1px solid var(--border-subtle)", background: "var(--bg-card)",
            color: "var(--text-secondary)", fontSize: "0.8125rem", cursor: "pointer",
          }}
        >
          <RefreshCw size={14} style={{ opacity: loading ? 0.5 : 1 }} /> Refresh
        </button>
      </div>

      {toast && (
        <div style={{
          marginBottom: 12, padding: "0.625rem 0.875rem", borderRadius: 8,
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
          color: "#22c55e", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: 6,
        }}>
          <CheckCircle size={14} /> {toast}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1.4fr)", gap: 16 }}>
        {/* Rooms list */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          borderRadius: 12, overflow: "hidden",
        }}>
          <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--border-subtle)", fontWeight: 600, fontSize: "0.875rem" }}>
            Rooms ({rooms.length})
          </div>
          {loading && rooms.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
              Loading rooms...
            </div>
          ) : rooms.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              <Users size={24} style={{ opacity: 0.4, margin: "0 auto 8px" }} />
              <p style={{ fontSize: "0.8125rem" }}>No rooms</p>
            </div>
          ) : (
            rooms.map((room) => {
              const active = selectedRoom === room.id;
              const c = countFor(room.id);
              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(active ? null : room.id)}
                  style={{
                    padding: "0.875rem 1rem", cursor: "pointer",
                    borderBottom: "1px solid var(--border-subtle)",
                    background: active ? "rgba(168,133,247,0.08)" : "transparent",
                    opacity: room.is_active ? 1 : 0.55,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6 }}>
                      {room.type === "public" ? <Globe size={13} color="var(--glow-cyan)" /> : <Lock size={13} color="var(--glow-amber)" />}
                      {room.name}
                      {!room.is_active && (
                        <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", border: "1px solid var(--border-subtle)", borderRadius: 4, padding: "1px 6px" }}>
                          archived
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                      {c?.message_count ?? 0} msgs · {c?.member_count ?? 0} members
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase",
                      padding: "2px 6px", borderRadius: 4,
                      background: room.purpose === "announcements" ? "rgba(245,158,11,0.12)" : room.purpose === "support" ? "rgba(6,182,212,0.12)" : "rgba(168,133,247,0.12)",
                      color: room.purpose === "announcements" ? "#f59e0b" : room.purpose === "support" ? "#06b6d4" : "#a855f7",
                    }}>
                      {room.purpose || "general"}
                    </span>
                    <span style={{
                      fontSize: "0.625rem", padding: "2px 6px", borderRadius: 4,
                      background: "var(--bg-primary)", color: "var(--text-muted)",
                      border: "1px solid var(--border-subtle)",
                    }}>
                      {room.type}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail pane */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          borderRadius: 12, overflow: "hidden", minHeight: 360,
        }}>
          {!selectedRoom ? (
            <div style={{
              height: "100%", minHeight: 360, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: 8,
            }}>
              <Shield size={32} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Select a room</p>
              <p style={{ fontSize: "0.75rem" }}>Edit purpose, archive, or remove spam messages</p>
            </div>
          ) : (
            <>
              {(() => {
                const room = rooms.find((r) => r.id === selectedRoom);
                if (!room) return null;
                return (
                  <div style={{ padding: "1rem", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 8 }}>{room.name}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Purpose
                        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                          {PURPOSES.map((p) => (
                            <button
                              key={p.value}
                              disabled={busy}
                              onClick={() => updateRoom(room.id, { purpose: p.value })}
                              style={{
                                padding: "0.375rem 0.625rem", borderRadius: 6, fontSize: "0.75rem",
                                border: (room.purpose || "general") === p.value
                                  ? "1px solid rgba(168,133,247,0.5)"
                                  : "1px solid var(--border-subtle)",
                                background: (room.purpose || "general") === p.value
                                  ? "rgba(168,133,247,0.12)" : "var(--bg-primary)",
                                color: (room.purpose || "general") === p.value ? "var(--glow-purple)" : "var(--text-secondary)",
                                cursor: busy ? "default" : "pointer",
                                textAlign: "left",
                              }}
                              title={p.desc}
                            >
                              {p.value === "announcements" && <Megaphone size={11} style={{ marginRight: 4, verticalAlign: -1 }} />}
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </label>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          disabled={busy}
                          onClick={() => updateRoom(room.id, { type: room.type === "public" ? "private" : "public" })}
                          style={{
                            padding: "0.4rem 0.75rem", borderRadius: 6, fontSize: "0.75rem",
                            border: "1px solid var(--border-subtle)", background: "var(--bg-primary)",
                            color: "var(--text-secondary)", cursor: busy ? "default" : "pointer",
                          }}
                        >
                          Make {room.type === "public" ? "private" : "public"}
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => updateRoom(room.id, { is_active: !room.is_active })}
                          style={{
                            padding: "0.4rem 0.75rem", borderRadius: 6, fontSize: "0.75rem",
                            border: "1px solid var(--border-subtle)", background: "var(--bg-primary)",
                            color: room.is_active ? "#f97316" : "#22c55e",
                            cursor: busy ? "default" : "pointer",
                            display: "flex", alignItems: "center", gap: 4,
                          }}
                        >
                          <Archive size={12} /> {room.is_active ? "Archive" : "Restore"}
                        </button>
                      </div>
                      {room.purpose === "announcements" && (
                        <div style={{
                          fontSize: "0.6875rem", color: "#f59e0b",
                          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                          borderRadius: 6, padding: "0.375rem 0.5rem",
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                          <Info size={12} /> Only moderators/platform admins can post in this room.
                        </div>
                      )}
                      {room.purpose === "support" && (
                        <div style={{
                          fontSize: "0.6875rem", color: "#06b6d4",
                          background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)",
                          borderRadius: 6, padding: "0.375rem 0.5rem",
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                          <Info size={12} /> Keep this room for support &amp; report topics only.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Recent messages ({messages.length}) — click 🗑 to remove spam
              </div>
              <div style={{ maxHeight: 420, overflowY: "auto" }}>
                {messages.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                    No messages
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: "0.625rem 1rem",
                        borderBottom: "1px solid var(--border-subtle)",
                        display: "flex", alignItems: "flex-start", gap: 8,
                        opacity: m.is_deleted ? 0.4 : 1,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: 2 }}>
                          {m.sender_id.slice(0, 8)}… · {new Date(m.created_at).toLocaleString()}
                          {m.is_deleted && <span style={{ color: "#ef4444", marginLeft: 6 }}>removed</span>}
                        </div>
                        <div style={{ fontSize: "0.8125rem", wordBreak: "break-word", textDecoration: m.is_deleted ? "line-through" : "none" }}>
                          {m.content}
                        </div>
                      </div>
                      {!m.is_deleted && (
                        <button
                          disabled={busy}
                          onClick={() => deleteMessage(m.id)}
                          title="Remove message"
                          style={{
                            width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                            border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)",
                            color: "#ef4444", cursor: busy ? "default" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
