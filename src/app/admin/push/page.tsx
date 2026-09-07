"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  BellRing, Send, Trash2, RefreshCw, CalendarClock, Zap, Users,
} from "lucide-react";

interface PushContent {
  id: string;
  title: string;
  body: string;
  type: string;
  audience: string;
  send_at: string;
  status: string; // scheduled | sent | failed
  sent_at: string | null;
  recipients_count: number;
  created_at: string;
}

const AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "customers", label: "Customers only" },
  { value: "vendors", label: "Vendors only" },
  { value: "trial", label: "Trial vendors" },
  { value: "paid", label: "Paid vendors" },
];

const TYPES = [
  { value: "content", label: "Daily content" },
  { value: "promo", label: "Promo / announcement" },
  { value: "motivation", label: "Motivation / tips" },
  { value: "business", label: "Business idea / news" },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: "rgba(245,158,11,0.1)", color: "var(--glow-amber)" },
  sent: { bg: "rgba(34,197,94,0.1)", color: "var(--glow-green)" },
  failed: { bg: "rgba(239,68,68,0.1)", color: "var(--glow-red)" },
};

export default function AdminPush() {
  const { error: showError, success: showSuccess, confirm: showConfirm } = useAlert();
  const isMobile = useMediaQuery("(max-width: 640px)");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("content");
  const [audience, setAudience] = useState("all");
  const [sendNow, setSendNow] = useState(true);
  const [scheduleAt, setScheduleAt] = useState("");
  const [sending, setSending] = useState(false);
  const [items, setItems] = useState<PushContent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/push");
      if (res.ok) setItems(await res.json());
    } catch { showError("Failed to load pushes"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: message.trim(),
          type,
          audience,
          sendNow,
          sendAt: sendNow ? undefined : scheduleAt,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      const created = await res.json();
      showSuccess(sendNow ? `Push sent to ${created.recipients_count || 0} device(s)` : "Scheduled — cron sends it when due");
      setTitle(""); setMessage(""); setScheduleAt("");
      await load();
    } catch (err: any) {
      showError(err.message || "Failed to send push");
    }
    setSending(false);
  };

  const deletePush = async (item: PushContent) => {
    if (item.status === "sent") return;
    const ok = await showConfirm({ title: "Cancel push", message: `Cancel "${item.title}"? It has not been sent yet.` });
    if (!ok) return;
    try {
      const res = await fetch(`/api/push?id=${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems(prev => prev.filter(i => i.id !== item.id));
      showSuccess("Push cancelled");
    } catch { showError("Failed to cancel push"); }
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const localDatetime = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: isMobile ? "0 0.75rem" : "0 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.125rem,3vw,1.5rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BellRing size={20} style={{ color: "var(--glow-purple)" }} /> Push Notifications
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Broadcast to app users on Android & iOS — daily tips, motivation, business ideas, announcements
          </p>
        </div>
        <button onClick={load} className="glow-button-secondary" style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", fontSize: "0.75rem" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Composer */}
      <form onSubmit={sendPush} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <Send size={14} style={{ color: "var(--glow-purple)" }} /> New push
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Title *</label>
            <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="e.g. 💡 Business idea of the day" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Type</label>
            <select className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)", boxSizing: "border-box" }} value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Message *</label>
          <textarea className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box", minHeight: "5rem", resize: "vertical" }} placeholder="Short, punchy message (shows on the lock screen)" value={message} onChange={(e) => setMessage(e.target.value)} required />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>
              <Users size={10} style={{ marginRight: 4, verticalAlign: -1 }} /> Audience
            </label>
            <select className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)", boxSizing: "border-box" }} value={audience} onChange={(e) => setAudience(e.target.value)}>
              {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>
              <CalendarClock size={10} style={{ marginRight: 4, verticalAlign: -1 }} /> Send
            </label>
            {sendNow ? (
              <button type="button" onClick={() => setSendNow(false)} className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", textAlign: "left", cursor: "pointer", color: "var(--text-secondary)" }}>
                <Zap size={12} style={{ marginRight: 4, verticalAlign: -1 }} /> Send now — click to schedule instead
              </button>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input type="datetime-local" className="ambient-input" style={{ flex: 1, padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
                <button type="button" onClick={() => setSendNow(true)} style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", background: "var(--bg-primary)", color: "var(--text-secondary)", cursor: "pointer", whiteSpace: "nowrap" }}>Now</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={sending || (!sendNow && !scheduleAt)} className="glow-button" style={{ padding: "0.5rem 1.25rem", fontSize: "0.75rem", opacity: sending ? 0.5 : 1 }}>
            {sending ? "Sending..." : sendNow ? "Send Push Now" : "Schedule Push"}
          </button>
        </div>
      </form>

      {/* History */}
      <div style={{ fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.75rem" }}>History</div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem" }}>
          <BellRing size={32} style={{ color: "var(--text-muted)", margin: "0 auto 0.75rem" }} />
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No pushes yet. Compose your first one above.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {items.map(item => {
            const st = STATUS_STYLE[item.status] || { bg: "var(--bg-secondary)", color: "var(--text-muted)" };
            return (
              <div key={item.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "10rem" }}>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{item.title}</div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "28rem" }}>{item.body}</div>
                  <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    {AUDIENCES.find(a => a.value === item.audience)?.label} · {fmt(item.send_at)}
                    {item.status === "sent" && item.recipients_count > 0 && ` · ${item.recipients_count} device${item.recipients_count === 1 ? "" : "s"}`}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ padding: "0.125rem 0.5rem", borderRadius: "1rem", fontSize: "0.5625rem", fontWeight: 600, background: st.bg, color: st.color, textTransform: "capitalize" }}>{item.status}</span>
                  {item.status !== "sent" && (
                    <button onClick={() => deletePush(item)} style={{ width: "2rem", height: "2rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.375rem", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "var(--glow-red)", cursor: "pointer" }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "1rem" }}>
        Note: pushes reach users who granted notification permission in the app. The daily cron (<code style={{ fontFamily: "monospace" }}>/api/cron/push-daily</code>) sends scheduled items at 08:00 UTC.
      </p>
    </div>
  );
}