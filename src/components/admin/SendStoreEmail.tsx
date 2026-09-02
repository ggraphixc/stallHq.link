"use client";

import { useState } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { X, Send, Loader2, Mail, AlertTriangle, Info, Gift, Bell, PenLine } from "lucide-react";

interface SendStoreEmailProps {
  storeId: string;
  storeName: string;
  storeEmail: string | null;
  onClose: () => void;
}

const EMAIL_TYPES = [
  { id: "reminder", label: "Reminder", icon: Bell, color: "var(--glow-purple)", description: "Payment due, incomplete setup, etc." },
  { id: "warning", label: "Warning", icon: AlertTriangle, color: "var(--glow-red)", description: "Violation, policy breach, etc." },
  { id: "info", label: "Info", icon: Info, color: "var(--glow-cyan)", description: "Feature update, maintenance notice, etc." },
  { id: "promotion", label: "Promotion", icon: Gift, color: "var(--glow-green)", description: "Special offer, discount, etc." },
  { id: "custom", label: "Custom", icon: PenLine, color: "var(--glow-amber)", description: "Write your own message" },
] as const;

const QUICK_TEMPLATES = [
  {
    id: "payment-reminder",
    type: "reminder" as const,
    subject: "Your subscription is about to expire",
    message: "Hi {store_name},\n\nYour stallHq subscription is expiring soon. To keep your store live and accessible to customers, please renew your plan.\n\nYou can upgrade anytime from your dashboard.\n\nIf you have any questions, reply to this email.\n\n— The stallHq Team",
  },
  {
    id: "setup-incomplete",
    type: "reminder" as const,
    subject: "Complete your store setup",
    message: "Hi {store_name},\n\nWe noticed your store setup isn't complete yet. To start getting orders:\n\n1. Add your first product\n2. Add a logo and description\n3. Share your store link\n\nNeed help? Reply to this email and we'll assist you.\n\n— The stallHq Team",
  },
  {
    id: "trial-ending",
    type: "warning" as const,
    subject: "Your trial is ending soon",
    message: "Hi {store_name},\n\nYour stallHq trial is ending soon. After expiry, your store will be temporarily unavailable to customers.\n\nUpgrade now to keep your store live:\n\n— The stallHq Team",
  },
  {
    id: "feature-update",
    type: "info" as const,
    subject: "New feature: Check out what's new",
    message: "Hi {store_name},\n\nWe've added some exciting new features to help you sell more:\n\n• Promo cards for social media\n• Enhanced analytics dashboard\n• Better mobile experience\n\nLog in to your dashboard to explore.\n\n— The stallHq Team",
  },
  {
    id: "special-offer",
    type: "promotion" as const,
    subject: "Special offer just for you",
    message: "Hi {store_name},\n\nAs a valued vendor on stallHq, we'd like to offer you an exclusive deal:\n\nUpgrade to an annual plan and save 30%! This offer is valid for the next 7 days.\n\nLog in to your dashboard to claim this offer.\n\n— The stallHq Team",
  },
];

export function SendStoreEmail({ storeId, storeName, storeEmail, onClose }: SendStoreEmailProps) {
  const { error: showError, success: showSuccess } = useAlert();
  const [sending, setSending] = useState(false);
  const [emailType, setEmailType] = useState<string>("reminder");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const applyTemplate = (template: typeof QUICK_TEMPLATES[number]) => {
    setEmailType(template.type);
    setSubject(template.subject);
    setMessage(template.message.replace("{store_name}", storeName));
    setShowTemplates(false);
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      showError("Subject and message are required");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          type: emailType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Failed to send email");
        return;
      }

      showSuccess(`Email sent to ${storeName}`);
      onClose();
    } catch {
      showError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const typeConfig = EMAIL_TYPES.find(t => t.id === emailType) || EMAIL_TYPES[0];
  const TypeIcon = typeConfig.icon;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div className="slide-up" style={{
        position: "relative", width: "100%", maxWidth: "32rem",
        background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
        borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Mail size={16} style={{ color: typeConfig.color }} />
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Send Email</h2>
          </div>
          <button onClick={onClose} style={{ width: "2.5rem", height: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Recipient */}
          <div style={{ padding: "0.75rem", background: "var(--bg-primary)", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)" }}>
            <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sending to</p>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, marginTop: "0.125rem" }}>{storeName}</p>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{storeEmail || "No email set"}</p>
          </div>

          {/* Quick Templates */}
          <div>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              style={{
                fontSize: "0.75rem", fontWeight: 500, color: "var(--glow-purple)",
                background: "none", border: "none", cursor: "pointer", padding: 0,
                display: "flex", alignItems: "center", gap: "0.25rem",
              }}
            >
              {showTemplates ? "Hide templates" : "Use a template"}
            </button>
            {showTemplates && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginTop: "0.5rem" }}>
                {QUICK_TEMPLATES.map((tpl) => {
                  const tplType = EMAIL_TYPES.find(t => t.id === tpl.type);
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: "0.5rem",
                        padding: "0.5rem 0.625rem", textAlign: "left",
                        background: "var(--bg-primary)", border: "1px solid var(--border-subtle)",
                        borderRadius: "0.375rem", cursor: "pointer", width: "100%",
                      }}
                    >
                      <span style={{ fontSize: "0.6875rem", color: tplType?.color, fontWeight: 600, flexShrink: 0 }}>{tplType?.label}</span>
                      <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>{tpl.subject}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email Type */}
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em", display: "block", marginBottom: "0.375rem" }}>Type</label>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {EMAIL_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = emailType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setEmailType(type.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.25rem",
                      padding: "0.375rem 0.625rem", borderRadius: "0.375rem",
                      fontSize: "0.6875rem", fontWeight: 500,
                      background: isActive ? `${type.color}15` : "var(--bg-primary)",
                      border: `1px solid ${isActive ? `${type.color}40` : "var(--border-subtle)"}`,
                      color: isActive ? type.color : "var(--text-muted)",
                      cursor: "pointer", minHeight: "44px",
                    }}
                  >
                    <Icon size={12} /> {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em", display: "block", marginBottom: "0.375rem" }}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              style={{
                width: "100%", padding: "0.625rem 0.75rem", fontSize: "0.8125rem",
                background: "var(--bg-primary)", border: "1px solid var(--border-subtle)",
                borderRadius: "0.5rem", color: "var(--text-primary)", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Message */}
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em", display: "block", marginBottom: "0.375rem" }}>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              rows={8}
              style={{
                width: "100%", padding: "0.625rem 0.75rem", fontSize: "0.8125rem",
                background: "var(--bg-primary)", border: "1px solid var(--border-subtle)",
                borderRadius: "0.5rem", color: "var(--text-primary)", outline: "none",
                resize: "vertical", lineHeight: 1.6, boxSizing: "border-box",
              }}
            />
            <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {message.length}/2000 characters
            </p>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim() || !storeEmail}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              padding: "0.75rem", width: "100%",
              background: sending || !subject.trim() || !message.trim() ? "rgba(168,133,247,0.05)" : "linear-gradient(135deg, #a855f7, #7c3aed)",
              border: "none", borderRadius: "0.5rem",
              color: sending || !subject.trim() || !message.trim() ? "var(--text-muted)" : "#fff",
              fontSize: "0.8125rem", fontWeight: 600,
              cursor: sending || !subject.trim() || !message.trim() ? "not-allowed" : "pointer",
              minHeight: "44px",
            }}
          >
            {sending ? (
              <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Sending...</>
            ) : (
              <><Send size={14} /> Send Email</>
            )}
          </button>

          {!storeEmail && (
            <p style={{ fontSize: "0.6875rem", color: "var(--glow-red)", textAlign: "center" }}>
              This vendor has no email address on file.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
