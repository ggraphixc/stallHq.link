"use client";

import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";

interface ShareCardProps {
  storeSlug: string;
  storeName: string;
  productName?: string;
  productId?: string;
}

export function ShareCard({ storeSlug, storeName, productName, productId }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const url = productId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${storeSlug}/product/${productId}`
    : `${typeof window !== "undefined" ? window.location.origin : ""}/${storeSlug}`;

  const text = productName
    ? `Check out ${productName} on ${storeName}`
    : `Check out ${storeName} on StallHq`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: text, text, url });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button
        onClick={handleNativeShare}
        style={{
          display: "flex", alignItems: "center", gap: "0.375rem",
          padding: "0.5rem 0.875rem", borderRadius: "0.5rem",
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 500,
          cursor: "pointer", transition: "all 0.15s",
        }}
        onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--glow-purple)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
      >
        <Share2 size={14} />
        Share
      </button>
      <button
        onClick={handleCopy}
        style={{
          display: "flex", alignItems: "center", gap: "0.375rem",
          padding: "0.5rem 0.875rem", borderRadius: "0.5rem",
          background: copied ? "rgba(34,197,94,0.1)" : "var(--bg-card)",
          border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "var(--border-subtle)"}`,
          color: copied ? "#22c55e" : "var(--text-secondary)",
          fontSize: "0.75rem", fontWeight: 500,
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy Link"}
      </button>
    </div>
  );
}
