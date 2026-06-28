"use client";

import { useState } from "react";
import { Store } from "@/types";
import { normalizeWhatsAppNumber } from "@/lib/channel";
import { MessageCircle, Loader2, ExternalLink, ArrowRight, Check } from "lucide-react";

interface WhatsAppConnectStepProps {
  store: Store;
  onConnected: () => void;
  onSkip: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.75rem",
  fontSize: "0.8125rem",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "0.375rem",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
};

export function WhatsAppConnectStep({ store, onConnected, onSkip }: WhatsAppConnectStepProps) {
  const [loading, setLoading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(store.whatsapp_number);

  const handleFinish = async () => {
    setLoading(true);
    try {
      await fetch("/api/stores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp_number: whatsappNumber, setup_complete: true }),
      });
      onConnected();
    } catch { onConnected(); } finally { setLoading(false); }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await fetch("/api/stores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setup_complete: true }),
      });
      onSkip();
    } catch { onSkip(); } finally { setLoading(false); }
  };

  const formatWhatsAppUrl = (number: string) => `https://wa.me/${number.replace(/[^0-9]/g, "")}`;

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ width: "3rem", height: "3rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
          <MessageCircle size={20} style={{ color: "var(--glow-green)" }} />
        </div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>Connect WhatsApp</h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Customers will order directly through WhatsApp</p>
      </div>

      {/* Card */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Number Input */}
        <div>
          <label style={labelStyle}>WhatsApp Number</label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ padding: "0.625rem 0.5rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRight: "none", borderRadius: "0.5rem 0 0 0.5rem", color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <MessageCircle size={12} />
              <span>+234</span>
            </span>
            <input
              type="tel"
              className="ambient-input"
              style={{ ...inputStyle, borderRadius: "0 0.5rem 0.5rem 0" }}
              placeholder="800 000 0000"
              value={(whatsappNumber || "").replace(/^\+234/, "")}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setWhatsappNumber(raw ? "+234" + raw.replace(/^234/, "") : "");
              }}
              onBlur={() => {
                if (whatsappNumber && !whatsappNumber.startsWith("+234")) {
                  setWhatsappNumber(normalizeWhatsAppNumber(whatsappNumber));
                }
              }}
            />
          </div>
          <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Nigerian number only. This is where customers will send orders.</p>
        </div>

        {/* Preview */}
        {whatsappNumber && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", padding: "0.75rem" }}>
            <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Preview</p>
            <a href={formatWhatsAppUrl(whatsappNumber)} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.625rem", color: "var(--glow-green)", textDecoration: "none" }}>
              <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MessageCircle size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, display: "block" }}>Chat on WhatsApp</span>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Test your link</span>
              </div>
              <ExternalLink size={14} style={{ opacity: 0.4 }} />
            </a>
          </div>
        )}

        {/* How it works */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", padding: "0.875rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.75rem" }}>How it works</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {[
              { step: "1", title: "Customer browses", desc: "They browse your store and add items to cart" },
              { step: "2", title: "They order", desc: 'They tap "Order via WhatsApp" to send you a message' },
              { step: "3", title: "You confirm", desc: "You receive the order and confirm via WhatsApp" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                <div style={{ width: "1.5rem", height: "1.5rem", borderRadius: "0.375rem", background: "rgba(168,133,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--glow-purple)" }}>{item.step}</span>
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600 }}>{item.title}</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button type="button" onClick={handleSkip} disabled={loading} style={{ flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-secondary)", fontSize: "0.8125rem", cursor: "pointer", fontWeight: 500, opacity: loading ? 0.5 : 1 }}>
            Skip
          </button>
          <button type="button" onClick={handleFinish} disabled={loading} className="glow-button" style={{ flex: 1, padding: "0.75rem", fontSize: "0.8125rem", opacity: loading ? 0.7 : 1 }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                Finishing...
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <Check size={16} />
                Complete Setup
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
