"use client";

import { Share2, Copy, Check, QrCode, Download } from "lucide-react";
import { useState, useEffect } from "react";
import QRCode from "qrcode";

interface ShareCardProps {
  storeSlug: string;
  storeName: string;
  productName?: string;
  productId?: string;
}

export function ShareCard({ storeSlug, storeName, productName, productId }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const url = productId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${storeSlug}/product/${productId}`
    : `${typeof window !== "undefined" ? window.location.origin : ""}/${storeSlug}`;

  const text = productName
    ? `Check out ${productName} on ${storeName}`
    : `Check out ${storeName} on stallHq`;

  useEffect(() => {
    if (showQR && url && !qrDataUrl) {
      QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: { dark: "#1e1b4b", light: "#ffffff" },
      }).then(setQrDataUrl).catch(() => {});
    }
  }, [showQR, url, qrDataUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: text, text, url });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${storeSlug}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
        <button
          onClick={() => setShowQR(!showQR)}
          style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            padding: "0.5rem 0.875rem", borderRadius: "0.5rem",
            background: showQR ? "rgba(168,133,247,0.1)" : "var(--bg-card)",
            border: `1px solid ${showQR ? "rgba(168,133,247,0.3)" : "var(--border-subtle)"}`,
            color: showQR ? "var(--glow-purple)" : "var(--text-secondary)",
            fontSize: "0.75rem", fontWeight: 500,
            cursor: "pointer", transition: "all 0.15s",
          }}
        >
          <QrCode size={14} />
          QR Code
        </button>
      </div>

      {showQR && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
          padding: "1rem", background: "var(--bg-primary)", borderRadius: "0.5rem",
          border: "1px solid var(--border-subtle)",
        }}>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`${storeName} QR Code`} style={{ width: "128px", height: "128px", borderRadius: "0.5rem" }} />
          ) : (
            <div style={{ width: "128px", height: "128px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Generating...
            </div>
          )}
          <button
            onClick={handleDownloadQR}
            disabled={!qrDataUrl}
            style={{
              display: "flex", alignItems: "center", gap: "0.25rem",
              padding: "0.375rem 0.75rem", borderRadius: "0.375rem",
              background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)", fontSize: "0.6875rem", fontWeight: 500,
              cursor: qrDataUrl ? "pointer" : "default", opacity: qrDataUrl ? 1 : 0.5,
            }}
          >
            <Download size={12} />
            Download QR
          </button>
        </div>
      )}
    </div>
  );
}
