"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Download, Image, Film, Sparkles, Check,
  Palette, Layout, X, RefreshCw
} from "lucide-react";
import { encodeGif } from "@/lib/gif-encoder";

interface PromoCardGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    description?: string;
    category?: string;
  };
  store: {
    slug: string;
    name: string;
    logo_url?: string;
    whatsapp_number?: string;
    instagram_handle?: string;
  };
}

type CardStyle = "modern" | "gradient" | "minimal" | "bold" | "neon";
type CardFormat = "status" | "story" | "post";

const CARD_STYLES: Record<CardStyle, { label: string; bg: string; accent: string; text: string; gradient?: string }> = {
  modern: { label: "Modern", bg: "#0f0f1a", accent: "#a855f7", text: "#f1f5f9" },
  gradient: { label: "Gradient", bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", accent: "#ffffff", text: "#ffffff" },
  minimal: { label: "Minimal", bg: "#ffffff", accent: "#111827", text: "#111827" },
  bold: { label: "Bold", bg: "#000000", accent: "#f59e0b", text: "#ffffff" },
  neon: { label: "Neon", bg: "#0a0a0a", accent: "#06b6d4", text: "#e0f2fe" },
};

const CARD_FORMATS: Record<CardFormat, { label: string; width: number; height: number; icon: string }> = {
  status: { label: "WhatsApp Status", width: 1080, height: 1920, icon: "📱" },
  story: { label: "Instagram Story", width: 1080, height: 1920, icon: "📸" },
  post: { label: "Instagram Post", width: 1080, height: 1080, icon: "🖼️" },
};

/** Fetch image as blob to avoid canvas tainted error */
async function loadImageBlob(url: string): Promise<HTMLImageElement | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const localUrl = URL.createObjectURL(blob);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => {
        URL.revokeObjectURL(localUrl);
        resolve();
      };
      img.src = localUrl;
    });
    if (img.complete && img.naturalWidth > 0) return img;
    URL.revokeObjectURL(localUrl);
    return null;
  } catch {
    return null;
  }
}

export function PromoCardGenerator({ isOpen, onClose, product, store }: PromoCardGeneratorProps) {
  const [cardStyle, setCardStyle] = useState<CardStyle>("modern");
  const [cardFormat, setCardFormat] = useState<CardFormat>("story");
  const [downloading, setDownloading] = useState(false);
  const [downloadedType, setDownloadedType] = useState<"image" | "gif" | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const format = CARD_FORMATS[cardFormat];
  const style = CARD_STYLES[cardStyle];

  const drawCard = useCallback(async (canvas: HTMLCanvasElement, animPhase = 0) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = format.width;
    const H = format.height;
    canvas.width = W;
    canvas.height = H;

    // ── Background ──────────────────────────────────────────────────
    if (style.bg.startsWith("linear")) {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#667eea");
      grad.addColorStop(1, "#764ba2");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = style.bg;
    }
    ctx.fillRect(0, 0, W, H);

    // ── Decorative orbs ─────────────────────────────────────────────
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = style.accent;
    ctx.beginPath();
    ctx.arc(W * 0.82, H * 0.1, W * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W * 0.18, H * 0.92, W * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ── Top bar ─────────────────────────────────────────────────────
    const barH = H * 0.05;
    ctx.fillStyle = style.accent;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(0, 0, W, barH);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${W * 0.025}px Inter, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("STALLHQ", W * 0.04, barH * 0.65);

    // ── Product Image ───────────────────────────────────────────────
    let imgBottom = H * 0.1;
    const img = product.image_url ? await loadImageBlob(product.image_url) : null;

    if (img) {
      const maxW = W * 0.85;
      const maxH = H * 0.42;
      const aspect = img.naturalWidth / img.naturalHeight;
      let drawW: number;
      let drawH: number;
      if (aspect > maxW / maxH) {
        drawW = maxW;
        drawH = maxW / aspect;
      } else {
        drawH = maxH;
        drawW = maxH * aspect;
      }
      const imgX = (W - drawW) / 2;
      const imgY = H * 0.08;

      // Soft shadow
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 50;
      ctx.shadowOffsetY = 12;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, drawW, drawH, 16);
      ctx.clip();
      ctx.drawImage(img, imgX, imgY, drawW, drawH);
      ctx.restore();

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      imgBottom = imgY + drawH + H * 0.025;
    } else {
      // Placeholder
      const phW = W * 0.75;
      const phH = H * 0.3;
      const phX = (W - phW) / 2;
      const phY = H * 0.1;
      ctx.fillStyle = style.accent;
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.roundRect(phX, phY, phW, phH, 16);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = `bold ${W * 0.06}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = style.accent;
      ctx.fillText("\u{1F4E6}", W / 2, phY + phH / 2 + W * 0.02);
      imgBottom = phY + phH + H * 0.025;
    }

    // ── Price ───────────────────────────────────────────────────────
    const priceText = `\u20A6${product.price.toLocaleString()}`;
    ctx.font = `800 ${W * 0.07}px Inter, sans-serif`;
    ctx.textAlign = "center";
    const priceW = ctx.measureText(priceText).width;
    const pillPad = W * 0.04;
    const pillH = W * 0.09;
    const pillY = imgBottom + H * 0.01;

    // Price pill background
    ctx.fillStyle = style.accent;
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.roundRect((W - priceW - pillPad * 2) / 2, pillY, priceW + pillPad * 2, pillH, 12);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Price text
    ctx.fillStyle = style.accent;
    ctx.fillText(priceText, W / 2, pillY + pillH * 0.7);

    // ── Product Name ────────────────────────────────────────────────
    ctx.fillStyle = style.text;
    ctx.font = `bold ${W * 0.048}px Inter, sans-serif`;
    const nameLines = wrapText(ctx, product.name, W * 0.85);
    const nameY = pillY + pillH + H * 0.02;
    nameLines.forEach((line, i) => {
      ctx.fillText(line, W / 2, nameY + i * W * 0.06);
    });
    const afterNameY = nameY + nameLines.length * W * 0.06;

    // ── Category badge ──────────────────────────────────────────────
    let badgeBottom = afterNameY;
    if (product.category) {
      const catY = afterNameY + H * 0.012;
      ctx.font = `600 ${W * 0.022}px Inter, sans-serif`;
      const catText = product.category.toUpperCase();
      const catW = ctx.measureText(catText).width;
      const catPad = W * 0.025;

      ctx.fillStyle = style.accent;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.roundRect((W - catW - catPad * 2) / 2, catY - W * 0.022, catW + catPad * 2, W * 0.04, 20);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = style.accent;
      ctx.textAlign = "center";
      ctx.fillText(catText, W / 2, catY + W * 0.005);
      badgeBottom = catY + W * 0.035;
    }

    // ── Divider ─────────────────────────────────────────────────────
    const divY = badgeBottom + H * 0.025;
    ctx.strokeStyle = style.accent;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W * 0.35, divY);
    ctx.lineTo(W * 0.65, divY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ── Bottom section ──────────────────────────────────────────────
    const bottomStart = H * 0.78;

    // CTA heading
    ctx.fillStyle = style.text;
    ctx.globalAlpha = 0.85;
    ctx.font = `800 ${W * 0.032}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("ORDER NOW ON STALLHQ", W / 2, bottomStart);
    ctx.globalAlpha = 1;

    // Store name
    ctx.fillStyle = style.text;
    ctx.globalAlpha = 0.5;
    ctx.font = `500 ${W * 0.026}px Inter, sans-serif`;
    ctx.fillText(store.name, W / 2, bottomStart + W * 0.048);

    // ── CTA Button ──────────────────────────────────────────────────
    const btnW = W * 0.55;
    const btnH = W * 0.09;
    const btnY = bottomStart + W * 0.08;

    // Pulse ring for animation
    if (animPhase > 0) {
      const pulse = (animPhase % 60) / 60;
      const scale = 1 + pulse * 0.12;
      const alpha = 0.3 * (1 - pulse);
      ctx.strokeStyle = style.accent;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.roundRect(
        (W - btnW * scale) / 2,
        btnY - (btnH * (scale - 1)) / 2,
        btnW * scale,
        btnH * scale,
        14
      );
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Button fill
    const btnGrad = ctx.createLinearGradient((W - btnW) / 2, btnY, (W + btnW) / 2, btnY);
    btnGrad.addColorStop(0, style.accent);
    btnGrad.addColorStop(1, lighten(style.accent, 40));
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect((W - btnW) / 2, btnY, btnW, btnH, 14);
    ctx.fill();

    // Button text
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${W * 0.032}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Shop Now", W / 2, btnY + btnH * 0.62);

    // ── QR Code ─────────────────────────────────────────────────────
    const qrSize = W * 0.12;
    const qrY = H * 0.91;

    // QR background
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect((W - qrSize - 20) / 2, qrY, qrSize + 20, qrSize + 20, 8);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // QR pattern
    ctx.fillStyle = style.bg === "#ffffff" ? "#111827" : style.bg;
    const block = (qrSize + 20) * 0.08;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if ((r + c) % 2 === 0 || (r < 2 && c < 2) || (r < 2 && c > 2) || (r > 2 && c < 2)) {
          ctx.fillRect(
            (W - qrSize - 20) / 2 + 10 + c * (qrSize / 5),
            qrY + 10 + r * (qrSize / 5),
            block,
            block
          );
        }
      }
    }

    // Scan label
    ctx.fillStyle = style.text;
    ctx.globalAlpha = 0.55;
    ctx.font = `500 ${W * 0.02}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Scan to Shop", W / 2, qrY + qrSize + 34);
    ctx.globalAlpha = 1;
  }, [product, store, format, style]);

  // Draw card on mount and when settings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawCard(canvas, 0);
  }, [cardStyle, cardFormat, drawCard]);

  const handleDownloadImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    await drawCard(canvas, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${product.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-stallhq.png`;
        a.click();
        URL.revokeObjectURL(url);
        setDownloadedType("image");
        setTimeout(() => setDownloadedType(null), 2000);
      }
      setDownloading(false);
    }, "image/png");
  };

  const handleDownloadGif = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);

    try {
      const offscreen = document.createElement("canvas");
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const offCtx = offscreen.getContext("2d")!;

      const gifFrames: { canvas: HTMLCanvasElement; delay: number }[] = [];
      const totalFrames = 20;
      const frameDelay = 150;

      for (let i = 0; i < totalFrames; i++) {
        await drawCard(canvas, i);
        offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
        offCtx.drawImage(canvas, 0, 0);
        const frameCanvas = document.createElement("canvas");
        frameCanvas.width = offscreen.width;
        frameCanvas.height = offscreen.height;
        frameCanvas.getContext("2d")!.drawImage(offscreen, 0, 0);
        gifFrames.push({ canvas: frameCanvas, delay: frameDelay });
      }

      const gifBlob = await encodeGif(gifFrames, { quality: 10 });
      const url = URL.createObjectURL(gifBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${product.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-stallhq-animated.gif`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadedType("gif");
      setTimeout(() => setDownloadedType(null), 2000);
    } catch {
      await handleDownloadImage();
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-primary)", border: "1px solid var(--border-subtle)",
          borderRadius: "1.25rem", maxWidth: "56rem", width: "100%",
          maxHeight: "90vh", overflow: "auto", position: "relative",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-subtle)",
          position: "sticky", top: 0, background: "var(--bg-primary)", zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{
              width: "2.25rem", height: "2.25rem", borderRadius: "0.625rem",
              background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={16} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Promo Card Generator</h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Create stunning status & story cards
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: "2rem", height: "2rem", borderRadius: "50%",
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            color: "var(--text-muted)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", padding: "1.5rem" }}>
          {/* Preview */}
          <div style={{ flex: "1 1 300px", minWidth: "280px" }}>
            <div style={{
              borderRadius: "1rem", overflow: "hidden",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-card)",
              aspectRatio: `${format.width}/${format.height}`,
              maxHeight: "60vh",
            }}>
              <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          </div>

          {/* Controls */}
          <div style={{ flex: "1 1 260px", minWidth: "260px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Format selector */}
            <div>
              <label style={labelStyle}>
                <Layout size={12} /> Card Format
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(Object.entries(CARD_FORMATS) as [CardFormat, (typeof CARD_FORMATS)[CardFormat]][]).map(([key, fmt]) => (
                  <button
                    key={key}
                    onClick={() => setCardFormat(key)}
                    style={{
                      flex: 1, padding: "0.625rem", borderRadius: "0.625rem",
                      border: `1.5px solid ${cardFormat === key ? "var(--glow-purple)" : "var(--border-subtle)"}`,
                      background: cardFormat === key ? "rgba(168,133,247,0.1)" : "var(--bg-card)",
                      color: cardFormat === key ? "var(--glow-purple)" : "var(--text-secondary)",
                      cursor: "pointer", fontSize: "0.6875rem", fontWeight: 600,
                      textAlign: "center", transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{fmt.icon}</div>
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style selector */}
            <div>
              <label style={labelStyle}>
                <Palette size={12} /> Card Style
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {(Object.entries(CARD_STYLES) as [CardStyle, (typeof CARD_STYLES)[CardStyle]][]).map(([key, s]) => (
                  <button
                    key={key}
                    onClick={() => setCardStyle(key)}
                    style={{
                      padding: "0.5rem 0.875rem", borderRadius: "0.5rem",
                      border: `1.5px solid ${cardStyle === key ? s.accent : "var(--border-subtle)"}`,
                      background: cardStyle === key ? `${s.accent}20` : "var(--bg-card)",
                      color: cardStyle === key ? s.accent : "var(--text-secondary)",
                      cursor: "pointer", fontSize: "0.75rem", fontWeight: 600,
                      display: "flex", alignItems: "center", gap: "0.375rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{
                      width: "0.75rem", height: "0.75rem", borderRadius: "50%",
                      background: s.bg.startsWith("linear") ? s.bg : s.accent,
                    }} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product info preview */}
            <div style={{
              padding: "1rem", borderRadius: "0.75rem",
              background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            }}>
              <h4 style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                Card Preview Info
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Product</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{product.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Price</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--glow-green)" }}>
                    ₦{product.price.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Store</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{store.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Size</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                    {format.width} × {format.height}
                  </span>
                </div>
              </div>
            </div>

            {/* Download buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <button
                onClick={handleDownloadImage}
                disabled={downloading}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  padding: "0.875rem", borderRadius: "0.75rem",
                  background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
                  color: "white", fontSize: "0.875rem", fontWeight: 700,
                  border: "none", cursor: "pointer", minHeight: "48px",
                  opacity: downloading ? 0.7 : 1, transition: "all 0.2s",
                }}
              >
                {downloadedType === "image" ? <Check size={18} /> : <Image size={18} />}
                {downloadedType === "image" ? "Downloaded!" : "Download as Image"}
              </button>

              <button
                onClick={handleDownloadGif}
                disabled={downloading}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  padding: "0.875rem", borderRadius: "0.75rem",
                  background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)", fontSize: "0.875rem", fontWeight: 600,
                  cursor: "pointer", minHeight: "48px",
                  opacity: downloading ? 0.7 : 1, transition: "all 0.2s",
                }}
              >
                {downloadedType === "gif" ? <Check size={18} /> : <Film size={18} />}
                {downloadedType === "gif" ? "Downloaded!" : downloading ? "Generating..." : "Download as GIF"}
              </button>
            </div>

            {/* Auto-post option */}
            {(store.whatsapp_number || store.instagram_handle) && (
              <div style={{
                padding: "1rem", borderRadius: "0.75rem",
                background: "rgba(168,133,247,0.06)",
                border: "1px solid rgba(168,133,247,0.15)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <Sparkles size={14} style={{ color: "var(--glow-purple)" }} />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Auto-Post</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                  StallHq can post this card directly to your status & story
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {store.whatsapp_number && (
                    <AutoPostButton
                      platform="whatsapp"
                      productId={product.id}
                      storeSlug={store.slug}
                    />
                  )}
                  {store.instagram_handle && (
                    <AutoPostButton
                      platform="instagram"
                      productId={product.id}
                      storeSlug={store.slug}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AutoPostButton({
  platform,
  productId,
  storeSlug,
}: {
  platform: "whatsapp" | "instagram";
  productId: string;
  storeSlug: string;
}) {
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  const handlePost = async () => {
    setPosting(true);
    try {
      const res = await fetch("/api/promo/auto-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, storeSlug, platform }),
      });
      if (res.ok) setPosted(true);
    } catch {
      // handle error
    } finally {
      setPosting(false);
    }
  };

  const colors = platform === "whatsapp"
    ? { bg: "rgba(37,211,102,0.15)", border: "rgba(37,211,102,0.3)", text: "#25d366", icon: "\uD83D\uDCAC" }
    : { bg: "rgba(225,48,108,0.15)", border: "rgba(225,48,108,0.3)", text: "#e1306c", icon: "\uD83D\uDCF8" };

  return (
    <button
      onClick={handlePost}
      disabled={posting || posted}
      style={{
        flex: 1, padding: "0.5rem", borderRadius: "0.5rem",
        background: posted ? `${colors.text}20` : colors.bg,
        border: `1px solid ${posted ? `${colors.text}40` : colors.border}`,
        color: colors.text, fontSize: "0.75rem", fontWeight: 600,
        cursor: posting || posted ? "default" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
        opacity: posting ? 0.7 : 1, transition: "all 0.2s",
      }}
    >
      {posted ? <Check size={12} /> : posting ? <RefreshCw size={12} className="animate-spin" /> : null}
      {posted ? "Posted!" : posting ? "Posting..." : `${colors.icon} Post to ${platform === "whatsapp" ? "Status" : "Story"}`}
    </button>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 3);
}

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const labelStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.375rem",
  fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)",
  marginBottom: "0.625rem", textTransform: "uppercase", letterSpacing: "0.03em",
};
