"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Store } from "@/types";
import { X, Download, Share2, Copy, Check } from "lucide-react";

interface ShareCardProps {
  store: Store;
  onClose: () => void;
}

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
};

export function ShareCard({ store, onClose }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const storeUrl = `https://stallhq.link/${store.slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = storeUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("store-qr-code");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      const link = document.createElement("a");
      link.download = `${store.slug}-qr-code.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: store.name, text: `Check out ${store.name} on StallHq!`, url: storeUrl });
      } catch { /* User cancelled */ }
    } else {
      handleCopy();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div className="slide-up" style={{ position: "relative", width: "100%", maxWidth: "28rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Share Your Store</h2>
          <button onClick={onClose} style={{ width: "2rem", height: "2rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Store Preview Card */}
          <div style={{ background: "linear-gradient(135deg, rgba(168,133,247,0.1), rgba(6,182,212,0.06))", borderRadius: "0.75rem", padding: "1.5rem", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} style={{ width: "4rem", height: "4rem", borderRadius: "0.75rem", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "4rem", height: "4rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.25rem" }}>
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.125rem" }}>{store.name}</h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  {store.description || "Digital storefront"}
                </p>
              </div>
            </div>

            {/* QR Code */}
            <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}>
              <div style={{ background: "white", padding: "1rem", borderRadius: "0.75rem" }}>
                <QRCodeSVG id="store-qr-code" value={storeUrl} size={140} level="H" includeMargin={false} />
              </div>
            </div>

            {/* URL */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", fontSize: "0.8125rem" }}>
              <span style={{ color: "var(--text-muted)" }}>stallhq.link/</span>
              <span style={{ fontWeight: 600, color: "var(--glow-purple)" }}>{store.slug}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            {[
              { icon: copied ? Check : Copy, label: copied ? "Copied!" : "Copy Link", onClick: handleCopy, color: copied ? "var(--glow-green)" : "var(--text-secondary)" },
              { icon: Download, label: "Download QR", onClick: handleDownloadQR, color: "var(--text-secondary)" },
              { icon: Share2, label: "Share", onClick: handleShare, color: "var(--text-secondary)" },
            ].map(({ icon: Icon, label, onClick, color }) => (
              <button
                key={label}
                onClick={onClick}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  color,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--text-muted)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)"; }}
              >
                <Icon size={20} />
                <span style={{ fontSize: "0.6875rem" }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
