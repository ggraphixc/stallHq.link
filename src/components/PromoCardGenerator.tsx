"use client";

import { useState, useRef, useCallback } from "react";
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

    canvas.width = format.width;
    canvas.height = format.height;

    // Background
    if (style.bg.startsWith("linear")) {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#667eea");
      grad.addColorStop(1, "#764ba2");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = style.bg;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative elements — subtle ambient glow circles
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = style.accent;
    ctx.beginPath();
    ctx.arc(canvas.width * 0.85, canvas.height * 0.12, 350, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvas.width * 0.15, canvas.height * 0.88, 280, 0, Math.PI * 2);
    ctx.fill();
    // Top-left corner glow
    const cornerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, canvas.width * 0.4);
    cornerGrad.addColorStop(0, style.accent);
    cornerGrad.addColorStop(1, "transparent");
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = cornerGrad;
    ctx.fillRect(0, 0, canvas.width * 0.5, canvas.height * 0.3);
    ctx.globalAlpha = 1;

    // Product image — maintain aspect ratio with cover crop
    let imageBottomY = canvas.height * 0.12;
    if (product.image_url) {
      try {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = product.image_url!;
        });
        if (img.complete && img.naturalWidth > 0) {
          const maxImgW = canvas.width * 0.78;
          const maxImgH = canvas.height * 0.4;
          const imgAspect = img.naturalWidth / img.naturalHeight;
          let imgW: number;
          let imgH: number;
          if (imgAspect > maxImgW / maxImgH) {
            imgW = maxImgW;
            imgH = maxImgW / imgAspect;
          } else {
            imgH = maxImgH;
            imgW = maxImgH * imgAspect;
          }
          const imgX = (canvas.width - imgW) / 2;
          const imgY = canvas.height * 0.08;

          // Subtle shadow under image
          ctx.shadowColor = "rgba(0,0,0,0.3)";
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 10;

          // Image container with rounded corners
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 20);
          ctx.clip();
          ctx.drawImage(img, imgX, imgY, imgW, imgH);
          ctx.restore();

          // Reset shadow
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;

          // Image border glow
          ctx.strokeStyle = style.accent;
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 20);
          ctx.stroke();
          ctx.globalAlpha = 1;

          imageBottomY = imgY + imgH + canvas.height * 0.03;
        }
      } catch {
        // Fallback placeholder
        ctx.fillStyle = style.accent;
        ctx.globalAlpha = 0.12;
        const phW = canvas.width * 0.78;
        const phH = canvas.height * 0.35;
        const phX = (canvas.width - phW) / 2;
        const phY = canvas.height * 0.08;
        ctx.beginPath();
        ctx.roundRect(phX, phY, phW, phH, 20);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = style.accent;
        ctx.font = `bold ${canvas.width * 0.08}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("📦", canvas.width / 2, phY + phH / 2 + canvas.width * 0.03);
        imageBottomY = phY + phH + canvas.height * 0.03;
      }
    }

    // ── Price Tag ──────────────────────────────────────────────────────
    const priceY = imageBottomY + canvas.height * 0.01;
    const priceText = `₦${product.price.toLocaleString()}`;
    ctx.font = `800 ${canvas.width * 0.075}px Inter, sans-serif`;
    const priceMetrics = ctx.measureText(priceText);
    const pricePadX = canvas.width * 0.05;
    const pricePadY = canvas.height * 0.012;

    // Price background pill
    ctx.fillStyle = style.accent;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.roundRect(
      (canvas.width - priceMetrics.width - pricePadX * 2) / 2,
      priceY - canvas.width * 0.075 - pricePadY,
      priceMetrics.width + pricePadX * 2,
      canvas.width * 0.075 + pricePadY * 2,
      14
    );
    ctx.fill();
    ctx.globalAlpha = 1;

    // Price text
    ctx.fillStyle = style.accent;
    ctx.textAlign = "center";
    ctx.fillText(priceText, canvas.width / 2, priceY);

    // ── Product Name ───────────────────────────────────────────────────
    ctx.fillStyle = style.text;
    ctx.font = `bold ${canvas.width * 0.058}px Inter, sans-serif`;
    const nameLines = wrapText(ctx, product.name, canvas.width * 0.82);
    const nameStartY = priceY + canvas.width * 0.085;
    nameLines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, nameStartY + i * canvas.width * 0.072);
    });

    // ── Category Badge ─────────────────────────────────────────────────
    let afterNameY = nameStartY + nameLines.length * canvas.width * 0.072;
    if (product.category) {
      const catY = afterNameY + canvas.height * 0.015;
      ctx.fillStyle = style.accent;
      ctx.globalAlpha = 0.18;
      const catText = product.category.toUpperCase();
      ctx.font = `600 ${canvas.width * 0.028}px Inter, sans-serif`;
      const catMetrics = ctx.measureText(catText);
      ctx.beginPath();
      ctx.roundRect(
        (canvas.width - catMetrics.width - 48) / 2,
        catY - canvas.width * 0.028,
        catMetrics.width + 48,
        canvas.width * 0.048,
        22
      );
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = style.accent;
      ctx.fillText(catText, canvas.width / 2, catY + canvas.width * 0.006);
      afterNameY = catY + canvas.width * 0.04;
    }

    // ── Divider line ───────────────────────────────────────────────────
    const divY = afterNameY + canvas.height * 0.035;
    const divW = canvas.width * 0.3;
    ctx.strokeStyle = style.accent;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo((canvas.width - divW) / 2, divY);
    ctx.lineTo((canvas.width + divW) / 2, divY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ── Bottom Section ─────────────────────────────────────────────────
    const bottomY = canvas.height * 0.78;

    // "ORDER NOW ON STALLHQ" — main CTA text
    ctx.fillStyle = style.text;
    ctx.globalAlpha = 0.85;
    ctx.font = `800 ${canvas.width * 0.038}px Inter, sans-serif`;
    ctx.fillText("ORDER NOW ON STALLHQ", canvas.width / 2, bottomY);
    ctx.globalAlpha = 1;

    // Store name
    ctx.fillStyle = style.text;
    ctx.globalAlpha = 0.55;
    ctx.font = `500 ${canvas.width * 0.03}px Inter, sans-serif`;
    ctx.fillText(store.name, canvas.width / 2, bottomY + canvas.width * 0.055);
    ctx.globalAlpha = 1;

    // CTA Button with animated pulse
    const ctaY = bottomY + canvas.width * 0.09;
    const ctaW = canvas.width * 0.52;
    const ctaH = canvas.width * 0.095;

    // Pulse ring animation for video
    if (animPhase > 0) {
      const pulseProgress = (animPhase % 60) / 60;
      const pulseScale = 1 + pulseProgress * 0.15;
      const pulseAlpha = 0.3 * (1 - pulseProgress);
      ctx.strokeStyle = style.accent;
      ctx.lineWidth = 2;
      ctx.globalAlpha = pulseAlpha;
      ctx.beginPath();
      ctx.roundRect(
        (canvas.width - ctaW * pulseScale) / 2,
        ctaY - (ctaH * (pulseScale - 1)) / 2,
        ctaW * pulseScale,
        ctaH * pulseScale,
        18
      );
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Button gradient
    const ctaGrad = ctx.createLinearGradient(
      (canvas.width - ctaW) / 2, ctaY,
      (canvas.width + ctaW) / 2, ctaY
    );
    ctaGrad.addColorStop(0, style.accent);
    ctaGrad.addColorStop(1, adjustColor(style.accent, 40));
    ctx.fillStyle = ctaGrad;
    ctx.beginPath();
    ctx.roundRect((canvas.width - ctaW) / 2, ctaY, ctaW, ctaH, 16);
    ctx.fill();

    // Button text
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${canvas.width * 0.036}px Inter, sans-serif`;
    ctx.fillText("Shop Now", canvas.width / 2, ctaY + ctaH * 0.62);

    // ── QR Code Area ───────────────────────────────────────────────────
    const qrSize = canvas.width * 0.11;
    const qrY = canvas.height * 0.91;

    // QR white background
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect((canvas.width - qrSize - 24) / 2, qrY, qrSize + 24, qrSize + 24, 10);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // QR placeholder pattern
    ctx.fillStyle = style.bg === "#ffffff" ? "#111827" : style.bg;
    const qrBlock = (qrSize + 24) * 0.08;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if ((r + c) % 2 === 0 || (r < 2 && c < 2) || (r < 2 && c > 2) || (r > 2 && c < 2)) {
          ctx.fillRect(
            (canvas.width - qrSize - 24) / 2 + 12 + c * (qrSize / 5),
            qrY + 12 + r * (qrSize / 5),
            qrBlock,
            qrBlock
          );
        }
      }
    }

    // "Scan to Shop" label
    ctx.fillStyle = style.text;
    ctx.globalAlpha = 0.6;
    ctx.font = `500 ${canvas.width * 0.022}px Inter, sans-serif`;
    ctx.fillText("Scan to Shop", canvas.width / 2, qrY + qrSize + 38);
    ctx.globalAlpha = 1;
  }, [product, store, format, style]);

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
      // Render frames to an offscreen canvas and collect them
      const offscreen = document.createElement("canvas");
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const offCtx = offscreen.getContext("2d")!;

      const gifFrames: { canvas: HTMLCanvasElement; delay: number }[] = [];
      const totalFrames = 20; // 20 frames × 150ms = 3 seconds
      const frameDelay = 150; // ms per frame

      for (let i = 0; i < totalFrames; i++) {
        await drawCard(canvas, i);
        // Copy to offscreen canvas
        offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
        offCtx.drawImage(canvas, 0, 0);
        // Clone for GIF encoder (it needs its own canvas reference)
        const frameCanvas = document.createElement("canvas");
        frameCanvas.width = offscreen.width;
        frameCanvas.height = offscreen.height;
        frameCanvas.getContext("2d")!.drawImage(offscreen, 0, 0);
        gifFrames.push({ canvas: frameCanvas, delay: frameDelay });
      }

      // Encode as animated GIF
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
      // Fallback: download single frame
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
    ? { bg: "rgba(37,211,102,0.15)", border: "rgba(37,211,102,0.3)", text: "#25d366", icon: "💬" }
    : { bg: "rgba(225,48,108,0.15)", border: "rgba(225,48,108,0.3)", text: "#e1306c", icon: "📸" };

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

function adjustColor(hex: string, amount: number): string {
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
