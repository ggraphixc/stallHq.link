"use client";

import { useState, useEffect } from "react";
import { Bell, Send, Info, AlertTriangle, CheckCircle, XCircle, Megaphone, Users } from "lucide-react";

const TYPE_OPTIONS = [
  { value: "info", label: "Info", icon: Info, color: "var(--glow-cyan)" },
  { value: "warning", label: "Warning", icon: AlertTriangle, color: "#f97316" },
  { value: "success", label: "Success", icon: CheckCircle, color: "var(--glow-green)" },
  { value: "error", label: "Error", icon: XCircle, color: "var(--glow-red)" },
  { value: "announcement", label: "Announcement", icon: Megaphone, color: "var(--glow-purple)" },
];
const TARGET_OPTIONS = [
  { value: "all", label: "All Vendors" },
  { value: "trial", label: "Trial Users" },
  { value: "monthly", label: "Monthly Subscribers" },
  { value: "quarterly", label: "Quarterly Subscribers" },
  { value: "annual", label: "Annual Subscribers" },
];
const TYPE_COLORS: Record<string, string> = {
  info: "var(--glow-cyan)", warning: "#f97316", success: "var(--glow-green)", error: "var(--glow-red)", announcement: "var(--glow-purple)",
};

interface Notification {
  id: string; title: string; body: string; type: string; target: string; sent_at: string; sent_by: string;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("info");
  const [target, setTarget] = useState("all");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch { setError("Failed to load notifications"); }
    setLoading(false);
  };

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, type, target }),
      });
      if (!res.ok) throw new Error("Failed to send");
      const notif = await res.json();
      setNotifications(prev => [notif, ...prev]);
      setShowCompose(false);
      setTitle(""); setBody(""); setType("info"); setTarget("all");
    } catch { setError("Failed to send notification"); }
    setSending(false);
  };

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.25rem,3vw,1.5rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bell size={24} style={{ color: "var(--glow-purple)" }} /> Notifications
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Send announcements and view system notifications</p>
        </div>
        <button onClick={() => setShowCompose(true)} className="glow-button" style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1rem", fontSize: "0.8125rem" }}>
          <Send size={16} /> Compose
        </button>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowCompose(false)} />
          <div className="slide-up" style={{ position: "relative", width: "100%", maxWidth: "32rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Send Notification</h2>
              <button onClick={() => setShowCompose(false)} style={{ width: "2.75rem", height: "2.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={sendNotification} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {error && <div style={{ padding: "0.625rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "var(--glow-red)", fontSize: "0.75rem" }}>{error}</div>}

              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Title</label>
                <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem" }} placeholder="Notification title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Type</label>
                  <select className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)" }} value={type} onChange={(e) => setType(e.target.value)}>
                    {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Target</label>
                  <select className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)" }} value={target} onChange={(e) => setTarget(e.target.value)}>
                    {TARGET_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Message</label>
                <textarea className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", resize: "none" }} rows={4} placeholder="Notification content..." value={body} onChange={(e) => setBody(e.target.value)} required />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowCompose(false)} style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={sending} className="glow-button" style={{ padding: "0.625rem 1.25rem", fontSize: "0.8125rem", opacity: sending ? 0.5 : 1 }}>
                  {sending ? "Sending..." : "Send Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem" }}>
            <Bell size={32} style={{ color: "var(--text-muted)", margin: "0 auto 0.75rem" }} />
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No notifications sent yet</p>
          </div>
        ) : notifications.map((n) => {
          const TypeIcon = TYPE_OPTIONS.find(t => t.value === n.type)?.icon || Info;
          return (
            <div key={n.id} style={{ padding: "1rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.625rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.375rem", background: `${TYPE_COLORS[n.type]}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TypeIcon size={14} style={{ color: TYPE_COLORS[n.type] }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600 }}>{n.title}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                    <span style={{ textTransform: "capitalize" }}>{n.type}</span>
                    <span>·</span>
                    <Users size={10} /> {TARGET_OPTIONS.find(t => t.value === n.target)?.label}
                    <span>·</span>
                    {new Date(n.sent_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{n.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
