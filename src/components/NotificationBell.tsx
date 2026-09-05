"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { useUserNotifications, UserNotification } from "@/hooks/useUserNotifications";
import { useWebPush } from "@/hooks/useWebPush";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllRead } = useUserNotifications(userId);
  const { isSupported, isSubscribed, subscribe } = useWebPush({ userId });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Auto-subscribe to push on first visit
  useEffect(() => {
    if (isSupported && !isSubscribed && userId) {
      subscribe();
    }
  }, [isSupported, isSubscribed, userId, subscribe]);

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "relative", width: "2.25rem", height: "2.25rem",
          borderRadius: "0.5rem", border: "1px solid var(--border-subtle)",
          background: "var(--bg-secondary)", color: "var(--text-secondary)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -3, right: -3,
            minWidth: 16, height: 16, borderRadius: 8,
            background: "var(--glow-purple)", color: "white",
            fontSize: "0.625rem", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", right: 0, marginTop: "0.5rem",
          width: "22rem", maxHeight: "28rem", overflowY: "auto",
          background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
          borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          zIndex: 50,
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.875rem 1rem", borderBottom: "1px solid var(--border-subtle)",
          }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: "0.6875rem", color: "var(--glow-purple)",
                  background: "none", border: "none", cursor: "pointer",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Push permission CTA */}
          {isSupported && !isSubscribed && (
            <div style={{
              margin: "0.5rem", padding: "0.625rem",
              background: "rgba(168,133,247,0.08)", border: "1px solid rgba(168,133,247,0.2)",
              borderRadius: "0.5rem", fontSize: "0.6875rem", color: "var(--text-secondary)",
              display: "flex", alignItems: "center", gap: "0.5rem",
            }}>
              <Bell size={14} style={{ color: "var(--glow-purple)", flexShrink: 0 }} />
              <span>Enable push notifications for order updates and alerts</span>
              <button
                onClick={subscribe}
                style={{
                  marginLeft: "auto", padding: "0.25rem 0.5rem",
                  background: "var(--glow-purple)", color: "white",
                  border: "none", borderRadius: "0.25rem", fontSize: "0.625rem",
                  fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                Enable
              </button>
            </div>
          )}

          {/* Notification list */}
          {notifications.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <Bell size={24} style={{ color: "var(--text-muted)", margin: "0 auto 0.5rem" }} />
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                style={{
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  background: n.read ? "transparent" : "rgba(168,133,247,0.04)",
                  display: "flex", gap: "0.5rem", alignItems: "flex-start",
                }}
              >
                <div style={{
                  width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0,
                  background: n.read ? "var(--text-muted)" : "var(--glow-purple)",
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>{n.title}</div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                  <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                </div>
                {!n.read ? (
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: "var(--glow-purple)", marginTop: 6, flexShrink: 0 }} />
                ) : (
                  <CheckCheck size={12} style={{ color: "var(--glow-green)", marginTop: 4, flexShrink: 0 }} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
