"use client";

import { useState } from "react";
import { X, Send, Loader2, Mail, Bell, AlertTriangle, Info, Gift, PenLine } from "lucide-react";

interface BulkEmailModalProps {
  storeCount: number;
  onSend: (subject: string, message: string, type: string) => Promise<boolean>;
  onClose: () => void;
  sending: boolean;
}

const EMAIL_TYPES = [
  { id: "reminder", label: "Reminder", icon: Bell, color: "var(--glow-purple)" },
  { id: "warning", label: "Warning", icon: AlertTriangle, color: "var(--glow-red)" },
  { id: "info", label: "Info", icon: Info, color: "var(--glow-cyan)" },
  { id: "promotion", label: "Promotion", icon: Gift, color: "var(--glow-green)" },
  { id: "custom", label: "Custom", icon: PenLine, color: "var(--glow-amber)" },
] as const;

const BULK_TEMPLATES = [
  { id: "maintenance", type: "info" as const, subject: "Scheduled maintenance notice", message: "Hi,\n\nWe'll be performing scheduled maintenance on stallHq this weekend. Your store may be briefly unavailable during this time.\n\nWe expect minimal disruption and will have everything back up as quickly as possible.\n\n— The stallHq Team" },
  { id: "new-feature", type: "info" as const, subject: "Exciting new features are here", message: "Hi,\n\nWe've been working hard on new features to help you sell more:\n\n• Improved analytics dashboard\n• Promo cards for social media\n• Better mobile experience\n\nLog in to your dashboard to try them out.\n\n— The stallHq Team" },
  { id: "seasonal-promo", type: "promotion" as const, subject: "Special seasonal offer for all vendors", message: "Hi,\n\nTo celebrate the season, we're offering all vendors an exclusive deal:\n\nUpgrade to an annual plan and save 30%! This offer is valid for the next 7 days.\n\nLog in to your dashboard to claim this offer.\n\n— The stallHq Team" },
  { id: "policy-update", type: "warning" as const, subject: "Important policy update", message: "Hi,\n\nWe've updated our platform policies. Please review the changes at your earliest convenience.\n\nKey changes:\n• Updated product listing guidelines\n• New review policy\n• Enhanced seller verification\n\nFull details available in your dashboard.\n\n— The stallHq Team" },
];

export function BulkEmailModal({ storeCount, onSend, onClose, sending }: BulkEmailModalProps) {
  const [emailType, setEmailType] = useState<string>("info");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const applyTemplate = (template: typeof BULK_TEMPLATES[number]) => {
    setEmailType(template.type);
    setSubject(template.subject);
    setMessage(template.message);
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    const success = await onSend(subject.trim(), message.trim(), emailType);
    // Modal closes on success via parent
  };

  const typeConfig = EMAIL_TYPES.find(t => t.id === emailType) || EMAIL_TYPES[0];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div className="slide-up" style={{
        position: "relative", width: "100%", maxWidth: "32rem",
        background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
        borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Mail size={16} style={{ color: "var(--glow-cyan)" }} />
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Bulk Email</h2>
          </div>
          <button onClick={onClose} style={{ width: "2.5rem", height: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Recipient count */}
          <div style={{ padding: "0.75rem", background: "rgba(168,133,247,0.08)", borderRadius: "0.5rem", border: "1px solid rgba(168,133,247,0.2)" }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--glow-purple)" }}>
              Sending to {storeCount} store{storeCount !== 1 ? "s" : ""}
            </p>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>
              Each vendor will receive an individual email.
            </p>
          </div>

          {/* Quick Templates */}
          <div>
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.375rem" }}>Quick Templates</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {BULK_TEMPLATES.map((tpl) => {
                const tplType = EMAIL_TYPES.find(t => t.id === tpl.type);
                return (
                  <button key={tpl.id} onClick={() => applyTemplate(tpl)} style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.5rem 0.625rem", textAlign: "left",
                    background: "var(--bg-primary)", border: "1px solid var(--border-subtle)",
                    borderRadius: "0.375rem", cursor: "pointer", width: "100%",
                  }}>
                    <span style={{ fontSize: "0.6875rem", color: tplType?.color, fontWeight: 600, flexShrink: 0 }}>{tplType?.label}</span>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>{tpl.subject}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email Type */}
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em", display: "block", marginBottom: "0.375rem" }}>Type</label>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {EMAIL_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = emailType === type.id;
                return (
                  <button key={type.id} onClick={() => setEmailType(type.id)} style={{
                    display: "flex", alignItems: "center", gap: "0.25rem",
                    padding: "0.375rem 0.625rem", borderRadius: "0.375rem",
                    fontSize: "0.6875rem", fontWeight: 500,
                    background: isActive ? `${type.color}15` : "var(--bg-primary)",
                    border: `1px solid ${isActive ? `${type.color}40` : "var(--border-subtle)"}`,
                    color: isActive ? type.color : "var(--text-muted)",
                    cursor: "pointer", minHeight: "44px",
                  }}>
                    <Icon size={12} /> {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em", display: "block", marginBottom: "0.375rem" }}>Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line"
              style={{ width: "100%", padding: "0.625rem 0.75rem", fontSize: "0.8125rem", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Message */}
          <div>
            <label style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em", display: "block", marginBottom: "0.375rem" }}>Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message here..." rows={6}
              style={{ width: "100%", padding: "0.625rem 0.75rem", fontSize: "0.8125rem", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-primary)", outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
          </div>

          {/* Send Button */}
          <button onClick={handleSend} disabled={sending || !subject.trim() || !message.trim()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              padding: "0.75rem", width: "100%",
              background: sending || !subject.trim() || !message.trim() ? "rgba(168,133,247,0.05)" : "linear-gradient(135deg, #a855f7, #7c3aed)",
              border: "none", borderRadius: "0.5rem",
              color: sending || !subject.trim() || !message.trim() ? "var(--text-muted)" : "#fff",
              fontSize: "0.8125rem", fontWeight: 600,
              cursor: sending || !subject.trim() || !message.trim() ? "not-allowed" : "pointer",
              minHeight: "44px",
            }}>
            {sending ? (<><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Sending to {storeCount} stores...</>) : (<><Send size={14} /> Send to {storeCount} Stores</>)}
          </button>
        </div>
      </div>
    </div>
  );
}
