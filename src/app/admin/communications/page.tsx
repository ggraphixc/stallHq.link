"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/contexts/AlertContext";
import {
  Send, Bell, BellRing, Mail, Info, AlertTriangle, CheckCircle, XCircle,
  Megaphone, Users, RefreshCw, Pencil, Trash2, Palette, Image as ImageIcon,
  Link as LinkIcon, Eye, CalendarClock, Zap, Sparkles, Wand2, Repeat,
} from "lucide-react";
import { EmailEditor } from "@/components/email-editor";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// ─── Shared ────────────────────────────────────────────────────────────────

type TabId = "in-app" | "push" | "email";

const TABS: { id: TabId; label: string; icon: typeof Bell }[] = [
  { id: "in-app", label: "In-App Notifications", icon: Bell },
  { id: "push", label: "Push Notifications", icon: BellRing },
  { id: "email", label: "Email Templates", icon: Mail },
];

// ─── In-App constants ──────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "info", label: "Info", icon: Info, color: "#06b6d4" },
  { value: "warning", label: "Warning", icon: AlertTriangle, color: "#f97316" },
  { value: "success", label: "Success", icon: CheckCircle, color: "#22c55e" },
  { value: "error", label: "Error", icon: XCircle, color: "#ef4444" },
  { value: "announcement", label: "Announcement", icon: Megaphone, color: "#a855f7" },
  { value: "promo", label: "Promo", icon: Sparkles, color: "#ec4899" },
];

const TARGET_OPTIONS = [
  { value: "all", label: "All Users", desc: "Vendors + customers" },
  { value: "vendors", label: "All Vendors", desc: "Store owners only" },
  { value: "customers", label: "All Customers", desc: "Buyers only" },
  { value: "trial", label: "Trial Users", desc: "Free trial vendors" },
  { value: "monthly", label: "Monthly Subscribers", desc: "Monthly plan" },
  { value: "quarterly", label: "Quarterly Subscribers", desc: "Quarterly plan" },
  { value: "annual", label: "Annual Subscribers", desc: "Annual plan" },
];

const TYPE_COLORS: Record<string, string> = {
  info: "#06b6d4", warning: "#f97316", success: "#22c55e", error: "#ef4444",
  announcement: "#a855f7", promo: "#ec4899", order: "#22c55e", reply: "#f59e0b", trend: "#3b82f6",
};

interface Notification {
  id: string; title: string; body: string; type: string; target?: string;
  image_url?: string; action_label?: string; action_link?: string;
  sent_at?: string; created_at: string; sent_by?: string; user_id?: string;
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
  scheduled: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
  sent: { bg: "rgba(34,197,94,0.1)", color: "#22c55e" },
  failed: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
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
  const [imageUrl, setImageUrl] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [actionLink, setActionLink] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
      setTarget(notif.target || "all");
      setImageUrl(notif.image_url || "");
      setActionLabel(notif.action_label || "");
      setActionLink(notif.action_link || "");
    } else {
      setEditingId(null);
      setTitle(""); setBody(""); setType("info"); setTarget("all");
      setImageUrl(""); setActionLabel(""); setActionLink("");
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
        ? `Update "${title}" for ${targetLabel}?`
        : `Send "${title}" to ${targetLabel}?${sendEmail ? " Emails will also be sent." : ""}`,
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      const url = "/api/admin/notifications";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId, title, body, type, target,
          image_url: imageUrl || undefined,
          action_label: actionLabel || undefined,
          action_link: actionLink || undefined,
          sendEmail: !isEdit && sendEmail,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      showSuccess(isEdit ? "Notification updated" : (sendEmail ? "Sent with emails" : "Notification sent to users"));
      setShowCompose(false);
      setEditingId(null);
      await fetchNotifications();
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

  const notifType = TYPE_OPTIONS.find(t => t.value === type);
  const TypeIcon = notifType?.icon || Info;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Send in-app notifications that appear in the bell icon for targeted users</p>
        <button onClick={() => openCompose()} className="glow-button" style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", fontSize: "0.75rem" }}>
          <Send size={14} /> New Notification
        </button>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowCompose(false)} />
          <div className="slide-up" style={{ position: "relative", width: "100%", maxWidth: "40rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>{editingId ? "Edit Notification" : "Create Notification"}</h2>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => setShowPreview(!showPreview)} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.75rem", fontSize: "0.6875rem", background: showPreview ? "rgba(168,133,247,0.15)" : "transparent", border: "1px solid rgba(168,133,247,0.3)", borderRadius: "0.375rem", color: "var(--glow-purple)", cursor: "pointer" }}>
                  <Eye size={12} /> Preview
                </button>
                <button onClick={() => setShowCompose(false)} style={{ width: "2rem", height: "2rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.375rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0", minHeight: "28rem" }}>
              {/* Form */}
              <form onSubmit={saveNotification} style={{ flex: 1, padding: isMobile ? "1rem" : "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem", borderRight: showPreview ? "1px solid var(--border-subtle)" : "none" }}>
                <div>
                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Title *</label>
                  <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="e.g. New feature just dropped!" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} />
                  <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginTop: "0.125rem", display: "block" }}>{title.length}/100</span>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                    <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Message *</label>
                    <button type="button" onClick={() => setShowEditor(true)} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", fontSize: "0.625rem", background: "rgba(168,133,247,0.1)", border: "1px solid rgba(168,133,247,0.3)", borderRadius: "0.375rem", color: "var(--glow-purple)", cursor: "pointer" }}>
                      <Palette size={10} /> Visual Editor
                    </button>
                  </div>
                  <textarea className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", resize: "vertical", boxSizing: "border-box", minHeight: "5rem" }} placeholder="Write your notification message..." value={body} onChange={(e) => setBody(e.target.value)} required />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Type</label>
                    <select className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)", boxSizing: "border-box" }} value={type} onChange={(e) => setType(e.target.value)}>
                      {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Audience</label>
                    <select className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)", boxSizing: "border-box" }} value={target} onChange={(e) => setTarget(e.target.value)}>
                      {TARGET_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Optional: Image URL */}
                <div>
                  <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
                    <ImageIcon size={10} /> Image URL <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" }}>(optional)</span>
                  </label>
                  <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="https://example.com/image.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                </div>

                {/* Optional: Action Button */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
                      <LinkIcon size={10} /> Button Label <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" }}>(optional)</span>
                    </label>
                    <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="e.g. View Details" value={actionLabel} onChange={(e) => setActionLabel(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Action Link</label>
                    <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="https://stallhq.link/store/..." value={actionLink} onChange={(e) => setActionLink(e.target.value)} />
                  </div>
                </div>

                {!editingId && (
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem", background: sendEmail ? "rgba(168,133,247,0.08)" : "var(--bg-primary)", border: `1px solid ${sendEmail ? "rgba(168,133,247,0.3)" : "var(--border-subtle)"}`, borderRadius: "0.5rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} style={{ accentColor: "var(--glow-purple)", width: "1rem", height: "1rem" }} />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Also send email to {TARGET_OPTIONS.find(t => t.value === target)?.label}</span>
                  </label>
                )}

                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
                  <button type="button" onClick={() => setShowCompose(false)} style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={saving} className="glow-button" style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", opacity: saving ? 0.5 : 1 }}>
                    {saving ? "Sending..." : editingId ? "Update" : "Send Now"}
                  </button>
                </div>
              </form>

              {/* Live Preview */}
              {showPreview && (
                <div style={{ width: isMobile ? "100%" : "18rem", padding: "1rem", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.75rem" }}>Mobile Preview</div>
                  <div style={{ background: "#111827", borderRadius: "1rem", padding: "0.75rem", border: "1px solid #374151" }}>
                    {/* Phone notch */}
                    <div style={{ width: "40%", height: "0.5rem", background: "#1f2937", borderRadius: "1rem", margin: "0 auto 0.75rem" }} />
                    {/* Notification card */}
                    <div style={{ background: "#1e293b", borderRadius: "0.75rem", padding: "0.875rem", border: `1px solid ${TYPE_COLORS[type]}30` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <div style={{ width: "1.5rem", height: "1.5rem", borderRadius: "0.375rem", background: `${TYPE_COLORS[type]}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <TypeIcon size={10} style={{ color: TYPE_COLORS[type] }} />
                        </div>
                        <span style={{ fontSize: "0.625rem", fontWeight: 600, color: TYPE_COLORS[type] }}>stallHq</span>
                        <span style={{ fontSize: "0.5rem", color: "#6b7280", marginLeft: "auto" }}>now</span>
                      </div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "0.25rem" }}>{title || "Notification title"}</div>
                      <div style={{ fontSize: "0.625rem", color: "#94a3b8", lineHeight: 1.4, marginBottom: imageUrl ? "0.5rem" : 0 }}>{body || "Your notification message will appear here..."}</div>
                      {imageUrl && (
                        <div style={{ borderRadius: "0.375rem", overflow: "hidden", marginBottom: "0.5rem", background: "#374151", height: "5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ImageIcon size={16} color="#6b7280" />
                        </div>
                      )}
                      {actionLabel && (
                        <div style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "0.375rem", background: TYPE_COLORS[type], color: "#fff", fontSize: "0.5625rem", fontWeight: 600 }}>
                          {actionLabel}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification History */}
      <div style={{ fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.25rem" }}>Sent Notifications</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem" }}>
            <Bell size={32} style={{ color: "var(--text-muted)", margin: "0 auto 0.75rem" }} />
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No notifications sent yet</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Click "New Notification" to send your first one</p>
          </div>
        ) : notifications.map((n) => {
          const TypeIcon = TYPE_OPTIONS.find(t => t.value === n.type)?.icon || Info;
          return (
            <div key={n.id} style={{ padding: "0.875rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.625rem", overflow: "hidden", wordBreak: "break-word" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                {n.image_url && (
                  <div style={{ width: "3rem", height: "3rem", borderRadius: "0.5rem", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={n.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.375rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, flex: 1 }}>
                      <div style={{ width: "1.5rem", height: "1.5rem", borderRadius: "0.375rem", background: `${TYPE_COLORS[n.type] || "#6b7280"}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <TypeIcon size={12} style={{ color: TYPE_COLORS[n.type] || "#6b7280" }} />
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
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.375rem" }} dangerouslySetInnerHTML={{ __html: n.body }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.625rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                    <span style={{ textTransform: "capitalize", color: TYPE_COLORS[n.type] || "var(--text-muted)" }}>{n.type}</span>
                    <span>·</span>
                    <span>{new Date(n.created_at).toLocaleDateString()}</span>
                    {n.action_link && <><span>·</span><a href={n.action_link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--glow-purple)", textDecoration: "underline" }}>{n.action_label || "Link"}</a></>}
                  </div>
                </div>
              </div>
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
          type, audience,
        }),
      });
      if (!res.ok) throw new Error("AI generation failed");
      const data = await res.json();
      return { title: data.title || title, body: data.body || message };
    } catch { return { title, body: message }; }
    finally { setAiGenerating(false); }
  };

  const submitPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) { showError("Title and message are required."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/push", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: message.trim(), type, audience, sendNow, sendAt: sendNow ? undefined : scheduleAt, repeatCadence: repeatCadence || undefined, seasonalPack: seasonalPack || undefined }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      const created = await res.json();
      showSuccess(sendNow ? `Push sent to ${created.recipients_count || 0} device(s)` : "Scheduled");
      setTitle(""); setMessage(""); setScheduleAt(""); setType("content"); setAudience("all"); setSeasonalPack(""); setSelectedSeasonalItems([]); setRepeatCadence("");
      await load();
    } catch (err: any) { showError(err.message || "Failed to send push"); }
    setSending(false);
  };

  const deletePush = async (item: PushContent) => {
    if (item.status === "sent") return;
    const ok = await showConfirm({ title: "Cancel push", message: `Cancel "${item.title}"?` });
    if (!ok) return;
    try {
      const res = await fetch(`/api/push?id=${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems(prev => prev.filter(i => i.id !== item.id));
      showSuccess("Push cancelled");
    } catch { showError("Failed to cancel push"); }
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Broadcast push notifications to app users — daily tips, promos, announcements</p>
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
            <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="e.g. Business idea of the day" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Type</label>
            <select className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)", boxSizing: "border-box" }} value={type} onChange={(e) => setType(e.target.value)}>
              {PUSH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <button type="button" onClick={generateAiTitle} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.625rem 0.875rem", fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(168,133,247,0.25)", background: "rgba(168,133,247,0.08)", color: "var(--glow-purple)", cursor: "pointer" }} disabled={sending || aiGenerating}>
            <Sparkles size={12} /> {aiGenerating ? "Generating..." : "Generate title"}
          </button>
          <button type="button" onClick={generateAiBody} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.625rem 0.875rem", fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(168,133,247,0.25)", background: "rgba(168,133,247,0.08)", color: "var(--glow-purple)", cursor: "pointer" }} disabled={sending || aiGenerating}>
            <Wand2 size={12} /> Write message for me
          </button>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Message *</label>
          <textarea className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box", minHeight: "5rem", resize: "vertical" }} placeholder="Short, punchy message (shows on the lock screen)" value={message} onChange={(e) => setMessage(e.target.value)} required />
        </div>

        {/* Advanced */}
        <div style={{ marginBottom: "0.75rem", padding: "0.75rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--glow-purple)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Sparkles size={12} /> Advanced options
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", marginRight: "0.25rem" }}>Seasonal pack:</span>
            <select className="ambient-input" style={{ padding: "0.375rem 0.625rem", fontSize: "0.75rem", borderRadius: "0.375rem", background: "var(--bg-primary)", boxSizing: "border-box" }} value={seasonalPack} onChange={(e) => setSeasonalPack(e.target.value)}>
              <option value="">— pick a pack —</option>
              {Object.entries(SEASONAL_PACKS).map(([key, pack]) => <option key={key} value={key}>{pack.title}</option>)}
            </select>
          </div>

          {Object.entries(SEASONAL_PACKS).map(([key, pack]) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.625rem 0.75rem", background: "var(--bg-primary)", borderRadius: "0.375rem", marginBottom: "0.5rem", borderLeft: seasonalPack === key ? "2px solid var(--glow-purple)" : "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--glow-purple)", marginBottom: "0.25rem" }}>{pack.title}</span>
              {pack.items.map((item, i) => (
                <label key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", cursor: "pointer", padding: "0.25rem 0" }}>
                  <input type="checkbox" checked={selectedSeasonalItems.includes(i)} onChange={(e) => { if (e.target.checked) setSelectedSeasonalItems(prev => [...prev, i]); else setSelectedSeasonalItems(prev => prev.filter(x => x !== i)); }} style={{ marginTop: 2, accentColor: "var(--glow-purple)", flexShrink: 0 }} />
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
              <button type="button" onClick={() => { const pack = SEASONAL_PACKS[seasonalPack]; if (!pack) return; for (const i of selectedSeasonalItems) { const item = pack.items[i]; if (item) { if (!title) setTitle(item.title); if (!message) setMessage(item.body); } } setSending(true); fetchAiContent().then(({ title: aiTitle, body: aiBody }) => { if (!title && aiTitle) setTitle(aiTitle); if (!message && aiBody) setMessage(aiBody); }).finally(() => setSending(false)); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", fontSize: "0.75rem", borderRadius: "0.5rem", background: "var(--glow-purple)", color: "#fff", cursor: "pointer" }}>
                <Sparkles size={12} /> Insert seasonal titles + AI polish
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
            <Repeat size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Repeat this push</span>
            <select className="ambient-input" style={{ padding: "0.375rem 0.625rem", fontSize: "0.75rem", borderRadius: "0.375rem", background: "var(--bg-primary)", boxSizing: "border-box", flex: 1, minWidth: "8rem" }} value={repeatCadence} onChange={(e) => setRepeatCadence(e.target.value)}>
              <option value="">One-time</option>
              <option value="daily-0800">Daily at 08:00</option>
              <option value="daily-1200">Daily at 12:00</option>
              <option value="daily-1800">Daily at 18:00</option>
              <option value="weekly-mon">Weekly on Monday</option>
              <option value="weekly-fri">Weekly on Friday</option>
            </select>
          </div>

          {repeatCadence && <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>When the cadence is set, the system will send this same push on schedule until you cancel it.</div>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}><Users size={10} style={{ marginRight: 4, verticalAlign: -1 }} /> Audience</label>
            <select className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)", boxSizing: "border-box" }} value={audience} onChange={(e) => setAudience(e.target.value)}>
              {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}><CalendarClock size={10} style={{ marginRight: 4, verticalAlign: -1 }} /> Send</label>
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
        <div style={{ textAlign: "center", padding: "3rem" }}><RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} /></div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem" }}>
          <BellRing size={32} style={{ color: "var(--text-muted)", margin: "0 auto 0.75rem" }} />
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No pushes yet</p>
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
    </div>
  );
}

// ─── Email Templates Tab ───────────────────────────────────────────────────

interface EmailTemplate {
  id: string; name: string; slug: string; description: string; category: string;
  subject_template: string; html_body: string; trigger_event: string;
  is_active: boolean; variables: string[]; created_at: string;
}

const EMAIL_CATEGORIES = [
  { value: "auth", label: "Auth", color: "#06b6d4" },
  { value: "subscription", label: "Subscription", color: "#a855f7" },
  { value: "order", label: "Order", color: "#22c55e" },
  { value: "support", label: "Support", color: "#f59e0b" },
  { value: "marketing", label: "Marketing", color: "#ec4899" },
  { value: "inventory", label: "Inventory", color: "#f97316" },
];

function EmailTemplatesTab({ isMobile }: { isMobile: boolean }) {
  const { error: showError, success: showSuccess, confirm: showConfirm } = useAlert();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newCategory, setNewCategory] = useState("marketing");
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-templates");
      if (res.ok) setTemplates(await res.json());
    } catch { showError("Failed to load templates"); }
    setLoading(false);
  };

  const filtered = templates.filter(t => {
    if (categoryFilter && t.category !== categoryFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.slug.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = categoryFilter ? filtered : EMAIL_CATEGORIES.map(cat => ({
    ...cat,
    templates: filtered.filter(t => t.category === cat.value),
  })).filter((g: any) => g.templates.length > 0);

  const toggleActive = async (t: EmailTemplate) => {
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, is_active: !t.is_active }),
      });
      if (!res.ok) throw new Error();
      setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_active: !x.is_active } : x));
      showSuccess(t.is_active ? "Template disabled" : "Template enabled");
    } catch { showError("Failed to update"); }
  };

  const deleteTemplate = async (t: EmailTemplate) => {
    const ok = await showConfirm({ title: "Delete template", message: `Delete "${t.name}"? This cannot be undone.` });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/email-templates?id=${t.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTemplates(prev => prev.filter(x => x.id !== t.id));
      showSuccess("Template deleted");
    } catch { showError("Failed to delete"); }
  };

  const createTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSlug.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, slug: newSlug, category: newCategory, description: "", subject_template: newName, html_body: "<p>Email content here</p>" }),
      });
      if (!res.ok) throw new Error();
      showSuccess("Template created");
      setShowCreate(false); setNewName(""); setNewSlug("");
      await loadTemplates();
    } catch { showError("Failed to create"); }
    setCreating(false);
  };

  const activeCount = templates.filter(t => t.is_active).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          <strong>{templates.length}</strong> templates · <strong>{activeCount}</strong> active
        </p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setShowCreate(true)} className="glow-button" style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", fontSize: "0.75rem" }}>
            <Mail size={14} /> New Template
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input className="ambient-input" style={{ flex: 1, minWidth: "10rem", padding: "0.5rem 0.75rem", fontSize: "0.75rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="ambient-input" style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", borderRadius: "0.5rem", background: "var(--bg-primary)", boxSizing: "border-box" }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {EMAIL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowCreate(false)} />
          <div className="slide-up" style={{ position: "relative", width: "100%", maxWidth: "28rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>New Email Template</h3>
            <form onSubmit={createTemplate} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Name</label>
                <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="e.g. Welcome Email" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Slug</label>
                <input className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", boxSizing: "border-box" }} placeholder="e.g. welcome" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>Category</label>
                <select className="ambient-input" style={{ width: "100%", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", borderRadius: "0.5rem", background: "var(--bg-primary)", boxSizing: "border-box" }} value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                  {EMAIL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={creating} className="glow-button" style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", opacity: creating ? 0.5 : 1 }}>{creating ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}><RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "var(--glow-purple)" }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem" }}>
          <Mail size={32} style={{ color: "var(--text-muted)", margin: "0 auto 0.75rem" }} />
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{search || categoryFilter ? "No templates match your filters" : "No templates yet"}</p>
        </div>
      ) : categoryFilter ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {filtered.map(t => (
            <TemplateRow key={t.id} template={t} expanded={expandedId === t.id} onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)} onToggleActive={() => toggleActive(t)} onDelete={() => deleteTemplate(t)} onEdit={() => { setEditingTemplate(t); setShowEditor(true); }} />
          ))}
        </div>
      ) : (
        (grouped as any[]).map(group => (
          <div key={group.value} style={{ marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0", marginBottom: "0.375rem" }}>
              <div style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: group.color, flexShrink: 0 }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "capitalize" }}>{group.label}</span>
              <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>({group.templates.length})</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {group.templates.map((t: EmailTemplate) => (
                <TemplateRow key={t.id} template={t} expanded={expandedId === t.id} onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)} onToggleActive={() => toggleActive(t)} onDelete={() => deleteTemplate(t)} onEdit={() => { setEditingTemplate(t); setShowEditor(true); }} />
              ))}
            </div>
          </div>
        ))
      )}

      {showEditor && editingTemplate && (
        <EmailEditor
          initialHtml={editingTemplate.html_body}
          onSave={async (html) => {
            try {
              const res = await fetch("/api/admin/email-templates", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingTemplate.id, html_body: html }),
              });
              if (res.ok) { setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, html_body: html } : t)); showSuccess("Template updated"); }
            } catch { showError("Failed to save"); }
            setShowEditor(false);
          }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}

function TemplateRow({ template: t, expanded, onToggle, onToggleActive, onDelete, onEdit }: {
  template: EmailTemplate; expanded: boolean; onToggle: () => void;
  onToggleActive: () => void; onDelete: () => void; onEdit: () => void;
}) {
  const catColor = EMAIL_CATEGORIES.find(c => c.value === t.category)?.color || "#6b7280";
  return (
    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", overflow: "hidden" }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.875rem", cursor: "pointer" }}>
        <div style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: catColor, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{t.name}</div>
          <div style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{t.slug} · {t.trigger_event || "manual"}</div>
        </div>
        <span style={{ padding: "0.125rem 0.5rem", borderRadius: "1rem", fontSize: "0.5625rem", fontWeight: 600, background: t.is_active ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.1)", color: t.is_active ? "#22c55e" : "#6b7280" }}>
          {t.is_active ? "Active" : "Inactive"}
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", transition: "transform 0.15s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
      </div>
      {expanded && (
        <div style={{ padding: "0.75rem 0.875rem", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-primary)" }}>
          {t.description && <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>{t.description}</p>}
          {t.variables?.length > 0 && (
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              {t.variables.map(v => <span key={v} style={{ padding: "0.125rem 0.5rem", borderRadius: "1rem", fontSize: "0.5625rem", background: "rgba(168,133,247,0.1)", color: "var(--glow-purple)", border: "1px solid rgba(168,133,247,0.2)" }}>{`{{${v}}}`}</span>)}
            </div>
          )}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button onClick={onEdit} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.75rem", fontSize: "0.6875rem", borderRadius: "0.375rem", border: "1px solid var(--border-subtle)", background: "var(--bg-secondary)", color: "var(--text-secondary)", cursor: "pointer" }}>
              <Palette size={10} /> Edit HTML
            </button>
            <button onClick={onToggleActive} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.75rem", fontSize: "0.6875rem", borderRadius: "0.375rem", border: "1px solid var(--border-subtle)", background: "var(--bg-secondary)", color: "var(--text-secondary)", cursor: "pointer" }}>
              {t.is_active ? "Disable" : "Enable"}
            </button>
            <button onClick={onDelete} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.75rem", fontSize: "0.6875rem", borderRadius: "0.375rem", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "var(--glow-red)", cursor: "pointer" }}>
              <Trash2 size={10} /> Delete
            </button>
          </div>
          {t.html_body && (
            <div style={{ marginTop: "0.75rem", borderRadius: "0.5rem", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
              <iframe srcDoc={t.html_body} style={{ width: "100%", height: "16rem", border: "none", background: "#fff" }} title="Email preview" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AdminCommunications() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [activeTab, setActiveTab] = useState<TabId>("in-app");

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: isMobile ? "0 0.75rem 2rem" : "0 1.5rem 2rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "clamp(1.125rem,3vw,1.5rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Send size={20} style={{ color: "var(--glow-purple)" }} /> Communications
        </h1>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>In-app notifications, push alerts, and email templates — all in one place</p>
      </div>

      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", fontSize: "0.75rem", fontWeight: isActive ? 600 : 500, borderRadius: "0.5rem", border: "1px solid", background: isActive ? "rgba(168,133,247,0.1)" : "transparent", borderColor: isActive ? "rgba(168,133,247,0.25)" : "var(--border-subtle)", color: isActive ? "var(--glow-purple)" : "var(--text-secondary)", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}>
              <TabIcon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "in-app" && <InAppTab isMobile={isMobile} />}
      {activeTab === "push" && <PushTab isMobile={isMobile} />}
      {activeTab === "email" && <EmailTemplatesTab isMobile={isMobile} />}
    </div>
  );
}
