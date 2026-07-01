"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const CONSENT_KEY = "stallhq_cookie_consent";

export type CookieConsentValue = "accepted" | "rejected";

function getStoredConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(CONSENT_KEY);
  if (v === "accepted" || v === "rejected") return v;
  return null;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getStoredConsent()) setVisible(true);
  }, []);

  function respond(value: CookieConsentValue) {
    localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        padding: "1rem",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          width: "100%",
          maxWidth: 640,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-medium)",
          borderRadius: "0.75rem",
          padding: "1.25rem 1.5rem",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0, flex: 1 }}>
            We use only essential cookies (Supabase auth sessions) to keep you signed in. No tracking, analytics, or
            third-party cookies. Read our{" "}
            <a href="/privacy" style={{ color: "var(--glow-purple)", textDecoration: "none" }}>
              Privacy Policy
            </a>{" "}
            for details.
          </p>
          <button
            onClick={() => respond("accepted")}
            aria-label="Dismiss"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0 }}>
          <button
            onClick={() => respond("rejected")}
            style={{
              flex: 1,
              padding: "0.625rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border-medium)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Essential Only
          </button>
          <button
            onClick={() => respond("accepted")}
            style={{
              flex: 1,
              padding: "0.625rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "var(--glow-purple)",
              color: "#fff",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
