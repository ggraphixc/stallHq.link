"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/contexts/AlertContext";
import {
  Send, Bell, BellRing, Mail, Info, AlertTriangle, CheckCircle, XCircle,
  Megaphone, Users, RefreshCw, Pencil, Trash2, Palette,
  CalendarClock, Zap, Sparkles, Wand2, Repeat, Construction,
} from "lucide-react";
import { EmailEditor } from "@/components/email-editor";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// ─── Shared ────────────────────────────────────────────────────────────────

type TabId = "in-app" | "push" | "email";

const TABS: { id: TabId; label: string; icon: typeof Bell }[] = [
  { id: "in-app", label: "In-App", icon: Bell },
  { id: "push", label: "Push", icon: BellRing },
  { id: "email", label: "Email", icon: Mail },
];

// ─── In-App constants ──────────────────────────────────────────────────────

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

// ─── Push constants ────────────────────────────────────────────────────────

interface PushContent {
  id: string; title: string; body: string; type: string; audience: string; send_at: string;
  status: string; sent_at: string | null; recipients_count: number; created_at: string;
}

const AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "customers", label: "Customers only" },
  { value: "vendors", label: "Vendors only" },
  { value: "trial", label: "Trial vendors" },
  { value: "paid", label: "Paid vendors" },
];

const PUSH_TYPES = [
  { value: "content", label: "Daily content" },
  { value: "promo", label: "Promo / announcement" },
  { value: "motivation", label: "Motivation / tips" },
  { value: "business", label: "Business idea / news" },
];

const SEASONAL_PACKS: Record<string, { title: string; items: { title: string; body: string; type: string }[] }> = {
  easter: {
    title: "Easter promotion",
    items: [
      { title: "🐣 New arrivals for the season", body: "Fresh picks just landed — tap to browse the new collection on your store.", type: "promo" },
      { title: "Spring cleaning sale", body: "Up to 20% off selected items this week only. Promote your bestsellers.", type: "promo" },
      { title: "Tip: Stock your bestsellers", body: "Vendors who keep 3-5 bestsellers visible get more orders. Feature them in your store header.", type: "motivation" },
    ],
  },
  mothersday: {
    title: "Mother's Day",
    items: [
      { title: "🌸 Mother's Day gift ideas", body: "Curated picks perfect for Mother's Day — share them with your customers now.", type: "promo" },
      { title: "Last call for shipping", body: "Order by Thursday to reach customers before the weekend. Remind your buyers.", type: "content" },
      { title: "Tip: Bundle products", body: "Bundle 2-3 related items at a discount — higher order value, happier buyers.", type: "motivation" },
    ],
  },
  ramadan: {
    title: "Ramadan",
    items: [
      { title: "🕌 Ramadan bundle deals", body: "Bundle your best-selling items for Iftar or Suhoor — great way to lift order value.", type: "promo" },
      { title: "Night market hours", body: "Update your store hours for Ramadan nights if you're open later — customers appreciate the heads-up.", type: "content" },
      { title: "Tip: Send before Iftar", body: "Send promotional messages 1-2 hours before Iftar when people are planning their evening.", type: "motivation" },
    ],
  },
  blackfriday: {
    title: "Black Friday",
    items: [
      { title: "🎉 Black Friday deals", body: "Announce your biggest sale of the year. Limited-time offers create urgency.", type: "promo" },
      { title: "Countdown to the sale", body: "Post a countdown a few days before — builds anticipation and early interest.", type: "content" },
      { title: "Tip: Inventory check", body: "Before a big sale, make sure your top deals are in stock and priced correctly.", type: "motivation" },
    ],
  },
  newyear: {
    title: "New Year",
    items: [
      { title: "✨ New Year, new you", body: "January is the biggest shopping reset of the year. Refresh your store with new products.", type: "content" },
      { title: "Resolution-themed bundles", body: "Group products around popular resolutions — fitness, self-care, productivity.", type: "promo" },
      { title: "Tip: Loyalty over discounts", body: "A thank-you note to repeat buyers beats a deep discount every time.", type: "motivation" },
    ],
  },
  independence: {
    title: "Independence Day",
    items: [
      { title: "🇳🇬 Independence Day sales", body: "Celebrate with a special offer — patriotic themes perform well this week.", type: "promo" },
      { title: "Long weekend hours", body: "Let customers know your operating hours for the long weekend.", type: "content" },
      { title: "Tip: Post early", body: "Post your holiday promo at least 3 days ahead — people plan their weekend purchases early.", type: "motivation" },
    ],
  },
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: "rgba(245,158,11,0.1)", color: "var(--glow-amber)" },
  sent: { bg: "rgba(34,197,94,0.1)", color: "var(--glow-green)" },
  failed: { bg: "rgba(239,68,68,0.1)", color: "var(--glow-red)" },
};

// ─── In-App Tab ────────────────────────────────────────────────────────────

function InAppTab({ isMobile }: { isMobile: boolean }) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Send announcements and manage in-app notifications</p>
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
            <div key={n.id} style={{ padding: "0.875rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.625rem", overflow: "hidden", wordBreak: "break-word" }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.625rem", color: "var(--text-muted)", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ textTransform: "capitalize", color: TYPE_COLORS[n.type] }}>{n.type}</span>
                <span>·</span>
                <span>{TARGET_OPTIONS.find(t => t.value === n.target)?.label}</span>
                <span>·</span>
                <span>{new Date(n.sent_at).toLocaleDateString()}</span>
              </div>
              <div className="notification-body" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, overflow: "hidden", wordBreak: "break-word", maxWidth: "100%" }} dangerouslySetInnerHTML={{ __html: n.body }} />
            </div>
          );
        })}
      </div>

      {showEditor && (
        <EmailEditor
          onSave={(html) => { setBody(html); setShowEditor(false); }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}

// ─── Push Tab ──────────────────────────────────────────────────────────────

function PushTab({ isMobile }: { isMobile: boolean }) {
  const { error: showError, success: showSuccess, confirm: showConfirm } = useAlert();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("content");
  const [audience, setAudience] = useState("all");
  const [sendNow, setSendNow] = useState(true);
  const [scheduleAt, setScheduleAt] = useState("");
  const [sending, setSending] = useState(false);
  const [items, setItems] = useState<PushContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonalPack, setSeasonalPack] = useState("");
  const [selectedSeasonalItems, setSelectedSeasonalItems] = useState<number[]>([]);
  const [repeatCadence, setRepeatCadence] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/push");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generateAiTitle = async () => {
    setAiGenerating(true);
    try {
      const { title: aiTitle } = await fetchAiContent();
      if (!title) setTitle(aiTitle || "");
    } finally { setAiGenerating(false); }
  };

  const generateAiBody = async () => {
    setAiGenerating(true);
    try {
      const { body: aiBody } = await fetchAiContent();
      if (!message) setMessage(aiBody || "");
    } finally { setAiGenerating(false); }
  };

  const fetchAiContent = async (): Promise<{ title: string; body: string }> => {
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Write a short push notification for a small business marketplace called stallHq. Type: ${type}. Audience: ${audience}. Message should be under 120 characters and feel friendly and helpful. Title should be under 50 characters and catchy. Output JSON: { title, body }.`,
          temperature: 0.7,
          max_tokens: 200,
        }),
      });
      if (!res.ok) throw new Error("AI generation failed");
      const data = await res.json();
      return {
        title: typeof data.title === "string" ? data.title : title,
        body: typeof data.body === "string" ? data.body : message,
      };
    } catch {
      return { title, body: message };
    }
    finally { setAiGenerating(false); }
  };

  const submitPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showError("Title and message are required.");
      return;
    }
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
          repeatCadence: repeatCadence || undefined,
          seasonalPack: seasonalPack || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      const created = await res.json();
      showSuccess(sendNow ? `Push sent to ${created.recipients_count || 0} device(s)` : "Scheduled — cron sends it when due");
      setTitle(""); setMessage(""); setScheduleAt(""); setType("content"); setAudience("all"); setSeasonalPack(""); setSelectedSeasonalItems([]); setRepeatCadence("");
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Broadcast to app users on Android & iOS — daily tips, motivation, business ideas, announcements</p>
        <button onClick={load} className="glow-button-secondary" style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", fontSize: "0.75rem" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Composer */}
      <form onSubmit={submitPush} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1.25rem" }}>
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
              {PUSH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <button type="button" onClick={generateAiTitle} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.625rem 0.875rem", fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(168,133,247,0.25)", background: "rgba(168,133,247,0.08)", color: "var(--glow-purple)", cursor: "pointer" }} disabled={sending}>
            <Sparkles size={12} /> Generate title
          </button>
          <button type="button" onClick={generateAiBody} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.625rem 0.875rem", fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(168,133,247,0.25)", background: "rgba(168,133,247,0.08)", color: "var(--glow-purple)", cursor: "pointer" }} disabled={sending}>
            <Wand2 size={12} /> Write message for me
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "center" }}>
          <Sparkles size={12} style={{ color: "var(--glow-purple)", flexShrink: 0 }} />
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", flex: 1 }}>
            Picks a title + writes a short message for the selected type. You can edit both before sending.
          </span>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Message *</label>
          <textarea className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box", minHeight: "5rem", resize: "vertical" }} placeholder="Short, punchy message (shows on the lock screen)" value={message} onChange={(e) => setMessage(e.target.value)} required />
        </div>

        {/* Advanced composer: seasonal packs + repeat */}
        <div style={{ marginBottom: "0.75rem", padding: "0.75rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--glow-purple)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Sparkles size={12} /> Advanced options
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", marginRight: "0.25rem" }}>Seasonal pack:</span>
            <select
              className="ambient-input"
              style={{ padding: "0.375rem 0.625rem", fontSize: "0.75rem", borderRadius: "0.375rem", background: "var(--bg-primary)", boxSizing: "border-box" }}
              value={seasonalPack}
              onChange={(e) => setSeasonalPack(e.target.value)}
            >
              <option value="">— pick a pack —</option>
              {Object.entries(SEASONAL_PACKS).map(([key, pack]) => (
                <option key={key} value={key}>{pack.title}</option>
              ))}
            </select>
          </div>

          {Object.entries(SEASONAL_PACKS).map(([key, pack]) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.625rem 0.75rem", background: "var(--bg-primary)", borderRadius: "0.375rem", marginBottom: "0.5rem", borderLeft: seasonalPack === key ? "2px solid var(--glow-purple)" : "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--glow-purple)", marginBottom: "0.25rem" }}>{pack.title}</span>
              {pack.items.map((item, i) => (
                <label key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", cursor: "pointer", padding: "0.25rem 0" }}>
                  <input
                    type="checkbox"
                    checked={selectedSeasonalItems.includes(i)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedSeasonalItems((prev) => [...prev, i]);
                      else setSelectedSeasonalItems((prev) => prev.filter((x) => x !== i));
                    }}
                    style={{ marginTop: 2, accentColor: "var(--glow-purple)", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, fontSize: "0.75rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: "0.125rem" }}>{item.title}</span>
                    <span style={{ color: "var(--text-muted)", display: "block", lineHeight: 1.4 }}>{item.body}</span>
                  </div>
                </label>
              ))}
            </div>
          ))}

          {selectedSeasonalItems.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", borderTopWidth: 1, borderTopColor: "var(--border-subtle)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
              <button
                type="button"
                onClick={() => {
                  const pack = SEASONAL_PACKS[seasonalPack];
                  if (!pack) return;
                  for (const i of selectedSeasonalItems) {
                    const item = pack.items[i];
                    if (item) {
                      if (!title) setTitle(item.title);
                      if (!message) setMessage(item.body);
                    }
                  }
                  setSending(true);
                  fetchAiContent()
                    .then(({ title: aiTitle, body: aiBody }) => {
                      if (!title && aiTitle) setTitle(aiTitle);
                      if (!message && aiBody) setMessage(aiBody);
                    })
                    .finally(() => setSending(false));
                }}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", fontSize: "0.75rem", borderRadius: "0.5rem", background: "var(--glow-purple)", color: "#fff", cursor: "pointer" }}
              >
                <Sparkles size={12} /> Insert seasonal titles + AI polish
              </button>
            </div>
          )}

          {/* Repeat cadence */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
            <Repeat size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Repeat this push</span>
            <select
              className="ambient-input"
              style={{ padding: "0.375rem 0.625rem", fontSize: "0.75rem", borderRadius: "0.375rem", background: "var(--bg-primary)", boxSizing: "border-box", flex: 1, minWidth: "8rem" }}
              value={repeatCadence}
              onChange={(e) => setRepeatCadence(e.target.value)}
            >
              <option value="">One-time</option>
              <option value="daily-0800">Daily at 08:00</option>
              <option value="daily-1200">Daily at 12:00</option>
              <option value="daily-1800">Daily at 18:00</option>
              <option value="weekly-mon">Weekly on Monday</option>
              <option value="weekly-fri">Weekly on Friday</option>
            </select>
          </div>

          {repeatCadence && (
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              When the cadence is set, the system will send this same push on schedule until you cancel it.
            </div>
          )}
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
          <button type="submit" disabled={sending || (!sendNow && !scheduleAt && !repeatCadence)} className="glow-button" style={{ padding: "0.5rem 1.25rem", fontSize: "0.75rem", opacity: sending ? 0.5 : 1 }}>
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

      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
        Note: pushes reach users who granted notification permission in the app. The daily cron (<code style={{ fontFamily: "monospace" }}>/api/cron/push-daily</code>) sends scheduled items at 08:00 UTC.
      </p>
    </div>
  );
}

// ─── Email Tab ─────────────────────────────────────────────────────────────

function EmailTab() {
  return (
    <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem" }}>
      <Construction size={40} style={{ color: "var(--glow-amber)", margin: "0 auto 1rem" }} />
      <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Email Broadcasts</h3>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", maxWidth: "24rem", margin: "0 auto", lineHeight: 1.6 }}>
        A full email broadcast composer is coming soon. For now, you can send emails alongside in-app notifications using the <strong>In-App</strong> tab, or manage templates from the Email Templates section.
      </p>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AdminCommunications() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [activeTab, setActiveTab] = useState<TabId>("in-app");

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: isMobile ? "0 0.75rem 2rem" : "0 1.5rem 2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "clamp(1.125rem,3vw,1.5rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Send size={20} style={{ color: "var(--glow-purple)" }} /> Communications
        </h1>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Manage notifications, push alerts, and email outreach from one place</p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                padding: "0.5rem 0.875rem", fontSize: "0.75rem", fontWeight: isActive ? 600 : 500,
                borderRadius: "0.5rem", border: "1px solid",
                background: isActive ? "rgba(168,133,247,0.1)" : "transparent",
                borderColor: isActive ? "rgba(168,133,247,0.25)" : "var(--border-subtle)",
                color: isActive ? "var(--glow-purple)" : "var(--text-secondary)",
                cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
              }}
            >
              <TabIcon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "in-app" && <InAppTab isMobile={isMobile} />}
      {activeTab === "push" && <PushTab isMobile={isMobile} />}
      {activeTab === "email" && <EmailTab />}
    </div>
  );
}
