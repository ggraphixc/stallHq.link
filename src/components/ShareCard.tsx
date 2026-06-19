"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Store } from "@/types";
import { X, Download, Share2, Copy, Check } from "lucide-react";

interface ShareCardProps {
  store: Store;
  onClose: () => void;
}

export function ShareCard({ store, onClose }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const storeUrl = `https://stallhq.link/${store.slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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
        await navigator.share({
          title: store.name,
          text: `Check out ${store.name} on StallHq!`,
          url: storeUrl,
        });
      } catch {
        // User cancelled or error occurred
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold">Share Your Store</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Store Preview Card */}
          <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-xl p-6 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-4 mb-4">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-2xl">
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg">{store.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {store.description || "Digital storefront"}
                </p>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center py-4">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG
                  id="store-qr-code"
                  value={storeUrl}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* URL */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-[var(--text-muted)]">stallhq.link/</span>
              <span className="font-semibold text-[var(--glow-purple)]">
                {store.slug}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleCopy}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-[var(--glow-green)]" />
              ) : (
                <Copy className="w-5 h-5 text-[var(--text-secondary)]" />
              )}
              <span className="text-xs text-[var(--text-secondary)]">
                {copied ? "Copied!" : "Copy Link"}
              </span>
            </button>

            <button
              onClick={handleDownloadQR}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] transition-colors"
            >
              <Download className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="text-xs text-[var(--text-secondary)]">
                Download QR
              </span>
            </button>

            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] transition-colors"
            >
              <Share2 className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="text-xs text-[var(--text-secondary)]">
                Share
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
