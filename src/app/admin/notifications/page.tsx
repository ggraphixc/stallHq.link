"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { Bell, Send, Info, AlertTriangle, CheckCircle, XCircle, Megaphone, Users, RefreshCw, Pencil, Trash2, Palette } from "lucide-react";
import { EmailEditor } from "@/components/email-editor";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
  const { error: showError, success: showSuccess, confirm: showConfirm } = useAlert();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("info");
  const [target, setTarget] = useState("all");
  const [sendEmail, setSendEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch { showError("Failed to load notifications"); }
    setLoading(false);
  };

  const openCompose = (notif?: Notification) => {
    if (notif) {
      setEditingId(notif.id);
      setTitle(notif.title);
      setBody(notif.body);
      setType(notif.type);
      setTarget(notif.target);
    } else {
      setEditingId(null);
      setTitle(""); setBody(""); setType("info"); setTarget("all");
    }
    setSendEmail(false);
    setShowCompose(true);
  };

  const saveNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const targetLabel = TARGET_OPTIONS.find(t => t.value === target)?.label || target;
    const isEdit = !!editingId;
    const confirmed = await showConfirm({
      title: isEdit ? "Update notification" : "Send notification",
      message: isEdit
        ? `Update "${title}"?`
        : `Send "${title}" to ${targetLabel}?${sendEmail ? " Emails will also be sent to recipients." : ""}`,
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      const url = "/api/admin/notifications";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, title, body, type, target, sendEmail: !isEdit && sendEmail }),
      });
      if (!res.ok) throw new Error("Failed");
      const notif = await res.json();
      if (isEdit) {
        setNotifications(prev => prev.map(n => n.id === editingId ? notif : n));
        showSuccess("Notification updated");
      } else {
        showSuccess(sendEmail ? "Notification sent with emails" : "Notification sent");
        setNotifications(prev => [notif, ...prev]);
      }
      setShowCompose(false);
      setEditingId(null);
    } catch { showError(isEdit ? "Failed to update" : "Failed to send"); }
    setSaving(false);
  };

  const deleteNotification = async (id: string) => {
    const confirmed = await showConfirm({ title: "Delete notification", message: "Permanently delete this notification?" });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setNotifications(prev => prev.filter(n => n.id !== id));
      showSuccess("Deleted");
    } catch { showError("Failed to delete"); }
  };

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.125rem,3vw,1.5rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bell size={20} style={{ color: "var(--glow-purple)" }} /> Notifications
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Send announcements and manage notifications</p>
        </div>
        <button onClick={() => openCompose()} className="glow-button" style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", fontSize: "0.75rem" }}>
          <Send size={14} /> Compose
        </button>
      </div>

      {/* Compose/Edit Modal */}
      {showCompose && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowCompose(false)} />
          <div className="slide-up" style={{ position: "relative", width: "100%", maxWidth: "32rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>{editingId ? "Edit Notification" : "Send Notification"}</h2>
              <button onClick={() => setShowCompose(false)} style={{ width: "2.75rem", height: "2.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={saveNotification} style={{ padding: isMobile ? "1rem" : "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Title</label>
                <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="Notification title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Type</label>
                  <select className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)", boxSizing: "border-box" }} value={type} onChange={(e) => setType(e.target.value)}>
                    {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Target</label>
                  <select className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)", boxSizing: "border-box" }} value={target} onChange={(e) => setTarget(e.target.value)}>
                    {TARGET_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Message</label>
                  <button type="button" onClick={() => setShowEditor(true)} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", fontSize: "0.625rem", background: "rgba(168,133,247,0.1)", border: "1px solid rgba(168,133,247,0.3)", borderRadius: "0.375rem", color: "var(--glow-purple)", cursor: "pointer" }}>
                    <Palette size={10} /> Visual Editor
                  </button>
                </div>
                <textarea className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", resize: "none", boxSizing: "border-box" }} rows={4} placeholder="Notification content..." value={body} onChange={(e) => setBody(e.target.value)} required />
              </div>

              {!editingId && (
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem", background: sendEmail ? "rgba(168,133,247,0.08)" : "var(--bg-primary)", border: `1px solid ${sendEmail ? "rgba(168,133,247,0.3)" : "var(--border-subtle)"}`, borderRadius: "0.5rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} style={{ accentColor: "var(--glow-purple)", width: "1rem", height: "1rem" }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Also send email to {TARGET_OPTIONS.find(t => t.value === target)?.label}</span>
                </label>
              )}

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button type="button" onClick={() => setShowCompose(false)} style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={saving} className="glow-button" style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", opacity: saving ? 0.5 : 1 }}>
                  {saving ? "Saving..." : editingId ? "Update" : "Send Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem" }}>
            <Bell size={32} style={{ color: "var(--text-muted)", margin: "0 auto 0.75rem" }} />
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No notifications sent yet</p>
          </div>
        ) : notifications.map((n) => {
          const TypeIcon = TYPE_OPTIONS.find(t => t.value === n.type)?.icon || Info;
          return (
            <div key={n.id} style={{ padding: "0.875rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.625rem" }}>
              {/* Title row with actions */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, flex: 1 }}>
                  <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.375rem", background: `${TYPE_COLORS[n.type]}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <TypeIcon size={14} style={{ color: TYPE_COLORS[n.type] }} />
                  </div>
                  <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</h3>
                </div>
                <div style={{ display: "flex", gap: "0.125rem", flexShrink: 0 }}>
                  <button onClick={() => openCompose(n)} style={{ width: "1.75rem", height: "1.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.375rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }} title="Edit">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => deleteNotification(n.id)} style={{ width: "1.75rem", height: "1.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.375rem", border: "none", background: "transparent", color: "var(--glow-red)", cursor: "pointer" }} title="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {/* Meta row */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.625rem", color: "var(--text-muted)", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ textTransform: "capitalize", color: TYPE_COLORS[n.type] }}>{n.type}</span>
                <span>·</span>
                <span>{TARGET_OPTIONS.find(t => t.value === n.target)?.label}</span>
                <span>·</span>
                <span>{new Date(n.sent_at).toLocaleDateString()}</span>
              </div>
              <div className="notif-body" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: n.body }} />
            </div>
          );
        })}
      </div>

      {/* Email Editor */}
      {showEditor && (
        <EmailEditor
          onSave={(html) => { setBody(html); setShowEditor(false); }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
