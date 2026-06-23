"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Share2, Copy, Check, X, ExternalLink } from "lucide-react";

interface ProductShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  storeName: string;
  productId: string;
  productName: string;
  productImage?: string;
  productPrice: number;
}

export function ProductShareModal({
  isOpen,
  onClose,
  storeSlug,
  storeName,
  productId,
  productName,
  productImage,
  productPrice,
}: ProductShareModalProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${storeSlug}/product/${productId}`;
  const shareText = `Check out ${productName} — ₦${productPrice.toLocaleString()} on ${storeName}`;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${productName} — ${storeName}`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "1rem",
          padding: "2rem",
          maxWidth: "24rem",
          width: "100%",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            width: "2rem",
            height: "2rem",
            borderRadius: "50%",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "0.75rem",
              background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 0.75rem",
            }}
          >
            <Share2 size={20} color="white" />
          </div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            Share Product
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            {productName}
          </p>
        </div>

        {/* Product preview */}
        {productImage && (
          <div
            style={{
              width: "100%",
              height: "10rem",
              borderRadius: "0.75rem",
              overflow: "hidden",
              marginBottom: "1.5rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <img
              src={productImage}
              alt={productName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}

        {/* QR Code */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "1rem",
              borderRadius: "0.75rem",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <QRCodeSVG
              value={shareUrl}
              size={160}
              level="M"
              includeMargin={false}
              fgColor="#1a1a2e"
              bgColor="white"
            />
          </div>
        </div>

        {/* Shareable link */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "0.625rem 0.75rem",
              borderRadius: "0.5rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "monospace",
            }}
          >
            {shareUrl}
          </div>
          <button
            onClick={handleCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.625rem 0.875rem",
              borderRadius: "0.5rem",
              background: copied ? "rgba(34,197,94,0.1)" : "var(--bg-card)",
              border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "var(--border-subtle)"}`,
              color: copied ? "#22c55e" : "var(--text-secondary)",
              fontSize: "0.75rem",
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleNativeShare}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Share2 size={16} />
            Share
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <ExternalLink size={16} />
            View
          </a>
        </div>

        {/* Store info */}
        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem" }}>
          {storeName} on StallHq
        </p>
      </div>
    </div>
  );
}
