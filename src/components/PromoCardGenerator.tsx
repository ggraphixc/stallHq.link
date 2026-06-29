"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Download, Image, Film, Sparkles, Check,
  Palette, Layout, X, RefreshCw, Share2
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

type CardStyle = "aurora" | "neon" | "sunset" | "ocean" | "royal";
type CardFormat = "status" | "story" | "post";

const CARD_STYLES: Record<CardStyle, {
  label: string; bg: string; accent: string; accentEnd: string;
  orb1: string; orb2: string; orb3: string;
  text: string; subtext: string;
}> = {
  aurora:  { label: "Aurora",  bg: "#050510", accent: "#a855f7", accentEnd: "#06b6d4", orb1: "#7c3aed", orb2: "#0ea5e9", orb3: "#d946ef", text: "#f8fafc", subtext: "#94a3b8" },
  neon:    { label: "Neon",    bg: "#0a0a0a", accent: "#f43f5e", accentEnd: "#f59e0b", orb1: "#ef4444", orb2: "#f59e0b", orb3: "#f97316", text: "#fafafa", subtext: "#a1a1aa" },
  sunset:  { label: "Sunset",  bg: "#0f0508", accent: "#f97316", accentEnd: "#ec4899", orb1: "#f97316", orb2: "#ec4899", orb3: "#8b5cf6", text: "#fff7ed", subtext: "#fdba74" },
  ocean:   { label: "Ocean",   bg: "#020617", accent: "#06b6d4", accentEnd: "#3b82f6", orb1: "#06b6d4", orb2: "#3b82f6", orb3: "#8b5cf6", text: "#ecfeff", subtext: "#67e8f9" },
  royal:   { label: "Royal",   bg: "#0a0510", accent: "#c084fc", accentEnd: "#f472b6", orb1: "#a855f7", orb2: "#f472b6", orb3: "#818cf8", text: "#faf5ff", subtext: "#c4b5fd" },
};

const CARD_FORMATS: Record<CardFormat, { label: string; width: number; height: number; icon: string }> = {
  status: { label: "WhatsApp Status", width: 1080, height: 1920, icon: "📱" },
  story:  { label: "Instagram Story", width: 1080, height: 1920, icon: "📸" },
  post:  { label: "Instagram Post",  width: 1080, height: 1080, icon: "🖼️" },
};

async function loadImageBlob(url: string): Promise<HTMLImageElement | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const localUrl = URL.createObjectURL(blob);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => { URL.revokeObjectURL(localUrl); resolve(); };
      img.src = localUrl;
    });
    if (img.complete && img.naturalWidth > 0) return img;
    URL.revokeObjectURL(localUrl);
    return null;
  } catch {
    return null;
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
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

// Pseudo-random seeded by index for consistent particle positions
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function PromoCardGenerator({ isOpen, onClose, product, store }: PromoCardGeneratorProps) {
  const [cardStyle, setCardStyle] = useState<CardStyle>("aurora");
  const [cardFormat, setCardFormat] = useState<CardFormat>("story");
  const [downloading, setDownloading] = useState(false);
  const [downloadedType, setDownloadedType] = useState<"image" | "gif" | null>(null);
  const [sharing, setSharing] = useState(false);
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

    const t = animPhase / 60; // normalized 0-1 animation progress

    // ════════════════════════════════════════════════════════════════
    // BACKGROUND — deep dark with animated aurora orbs
    // ════════════════════════════════════════════════════════════════
    ctx.fillStyle = style.bg;
    ctx.fillRect(0, 0, W, H);

    // Aurora orb 1 — large, top-right, slow drift
    const orb1X = W * 0.75 + Math.sin(t * Math.PI * 2) * W * 0.08;
    const orb1Y = H * 0.12 + Math.cos(t * Math.PI * 2) * H * 0.03;
    const orb1R = W * 0.55;
    const orb1Rgb = hexToRgb(style.orb1);
    if (orb1Rgb) {
      const g1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, orb1R);
      g1.addColorStop(0, `rgba(${orb1Rgb.r},${orb1Rgb.g},${orb1Rgb.b},0.18)`);
      g1.addColorStop(0.4, `rgba(${orb1Rgb.r},${orb1Rgb.g},${orb1Rgb.b},0.06)`);
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H * 0.5);
    }

    // Aurora orb 2 — bottom-left
    const orb2X = W * 0.2 + Math.cos(t * Math.PI * 2) * W * 0.06;
    const orb2Y = H * 0.85 + Math.sin(t * Math.PI * 2) * H * 0.04;
    const orb2R = W * 0.5;
    const orb2Rgb = hexToRgb(style.orb2);
    if (orb2Rgb) {
      const g2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, orb2R);
      g2.addColorStop(0, `rgba(${orb2Rgb.r},${orb2Rgb.g},${orb2Rgb.b},0.14)`);
      g2.addColorStop(0.4, `rgba(${orb2Rgb.r},${orb2Rgb.g},${orb2Rgb.b},0.04)`);
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, H * 0.5, W, H * 0.5);
    }

    // Aurora orb 3 — center accent
    const orb3X = W * 0.5 + Math.sin(t * Math.PI * 4) * W * 0.04;
    const orb3Y = H * 0.45 + Math.cos(t * Math.PI * 4) * H * 0.02;
    const orb3R = W * 0.4;
    const orb3Rgb = hexToRgb(style.orb3);
    if (orb3Rgb) {
      const g3 = ctx.createRadialGradient(orb3X, orb3Y, 0, orb3X, orb3Y, orb3R);
      g3.addColorStop(0, `rgba(${orb3Rgb.r},${orb3Rgb.g},${orb3Rgb.b},0.1)`);
      g3.addColorStop(0.5, `rgba(${orb3Rgb.r},${orb3Rgb.g},${orb3Rgb.b},0.02)`);
      g3.addColorStop(1, "transparent");
      ctx.fillStyle = g3;
      ctx.fillRect(0, H * 0.2, W, H * 0.6);
    }

    // ── Particle/star field ────────────────────────────────────────
    for (let i = 0; i < 60; i++) {
      const px = seededRandom(i) * W;
      const py = seededRandom(i + 100) * H;
      const pSize = seededRandom(i + 200) * 2 + 0.5;
      const flicker = 0.3 + 0.7 * Math.abs(Math.sin(t * Math.PI * 2 + i));
      ctx.fillStyle = `rgba(255,255,255,${flicker * 0.5})`;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // ════════════════════════════════════════════════════════════════
    // GLASSMORPHISM CARD — inner frosted panel
    // ════════════════════════════════════════════════════════════════
    const cardMargin = W * 0.05;
    const cardW = W - cardMargin * 2;
    const cardH = H - cardMargin * 2;
    const cardR = W * 0.06;

    // Glass fill
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardMargin, cardMargin, cardW, cardH, cardR);
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(cardMargin, cardMargin, cardW, cardH);
    ctx.restore();

    // Neon border glow (animated)
    const borderAlpha = 0.4 + 0.2 * Math.sin(t * Math.PI * 2);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardMargin, cardMargin, cardW, cardH, cardR);

    // Outer glow
    ctx.shadowColor = style.accent;
    ctx.shadowBlur = 25 + 10 * Math.sin(t * Math.PI * 2);
    ctx.strokeStyle = `${style.accent}${Math.round(borderAlpha * 255).toString(16).padStart(2, "0")}`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner glow
    ctx.shadowColor = style.accentEnd;
    ctx.shadowBlur = 15 + 8 * Math.cos(t * Math.PI * 2);
    ctx.strokeStyle = `${style.accentEnd}${Math.round(borderAlpha * 0.6 * 255).toString(16).padStart(2, "0")}`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // ════════════════════════════════════════════════════════════════
    // TOP SECTION — store logo + "Exclusive Offer" tag
    // ════════════════════════════════════════════════════════════════
    const topY = cardMargin + W * 0.045;
    const iconSize = W * 0.065;
    const iconX = cardMargin + W * 0.07;

    // Store icon with glow
    ctx.save();
    ctx.shadowColor = style.accent;
    ctx.shadowBlur = 12;
    ctx.fillStyle = `${style.accent}25`;
    ctx.beginPath();
    ctx.arc(iconX, topY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = style.accent;
    ctx.font = `bold ${W * 0.026}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(store.name.charAt(0).toUpperCase(), iconX, topY + iconSize / 2 + 1);
    ctx.textBaseline = "alphabetic";

    // "Exclusive Offer" tag — right side
    const tagText = "EXCLUSIVE OFFER";
    ctx.font = `700 ${W * 0.015}px Inter, sans-serif`;
    const tagW = ctx.measureText(tagText).width;
    const tagPad = W * 0.018;
    const tagX = cardMargin + cardW - tagW - tagPad * 2 - W * 0.04;
    const tagY = topY + iconSize * 0.15;

    // Tag background with shimmer
    const shimmerOffset = (t * 2) % 1;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagW + tagPad * 2, iconSize * 0.7, 20);
    ctx.clip();
    const tagGrad = ctx.createLinearGradient(tagX - tagW, tagY, tagX + tagW + tagPad * 2, tagY);
    tagGrad.addColorStop(0, `${style.accent}30`);
    tagGrad.addColorStop(shimmerOffset * 0.5, `${style.accent}50`);
    tagGrad.addColorStop(shimmerOffset * 0.5 + 0.1, "rgba(255,255,255,0.15)");
    tagGrad.addColorStop(shimmerOffset * 0.5 + 0.2, `${style.accent}30`);
    tagGrad.addColorStop(1, `${style.accent}20`);
    ctx.fillStyle = tagGrad;
    ctx.fillRect(tagX, tagY, tagW + tagPad * 2, iconSize * 0.7);
    ctx.restore();

    ctx.fillStyle = style.accent;
    ctx.font = `700 ${W * 0.015}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(tagText, tagX + (tagW + tagPad * 2) / 2, tagY + iconSize * 0.42);

    // ════════════════════════════════════════════════════════════════
    // PRODUCT NAME — huge dramatic gradient text
    // ════════════════════════════════════════════════════════════════
    const nameY = topY + iconSize + H * 0.04;
    const nameFontSize = W * 0.095;
    ctx.font = `900 ${nameFontSize}px Inter, sans-serif`;
    ctx.textAlign = "center";

    const nameLines = wrapText(ctx, product.name.toUpperCase(), W * 0.78);

    // Gradient text
    const textGrad = ctx.createLinearGradient(W * 0.15, nameY, W * 0.85, nameY + nameLines.length * nameFontSize * 1.05);
    textGrad.addColorStop(0, style.accent);
    textGrad.addColorStop(0.5, style.accentEnd);
    textGrad.addColorStop(1, style.accent);

    // Text glow
    ctx.save();
    ctx.shadowColor = style.accent;
    ctx.shadowBlur = 30;
    ctx.fillStyle = textGrad;
    nameLines.forEach((line, i) => {
      ctx.fillText(line, W / 2, nameY + i * nameFontSize * 1.05);
    });
    ctx.restore();

    // Second pass — crisp text on top
    ctx.fillStyle = textGrad;
    nameLines.forEach((line, i) => {
      ctx.fillText(line, W / 2, nameY + i * nameFontSize * 1.05);
    });

    const afterNameY = nameY + nameLines.length * nameFontSize * 1.05 + H * 0.015;

    // ════════════════════════════════════════════════════════════════
    // PRODUCT IMAGE — with neon glow border
    // ════════════════════════════════════════════════════════════════
    const img = product.image_url ? await loadImageBlob(product.image_url) : null;
    let imgBottom = afterNameY;

    if (img) {
      const maxW = W * 0.8;
      const maxH = H * 0.36;
      const aspect = img.naturalWidth / img.naturalHeight;
      let drawW: number, drawH: number;
      if (aspect > maxW / maxH) { drawW = maxW; drawH = maxW / aspect; }
      else { drawH = maxH; drawW = maxH * aspect; }
      const imgX = (W - drawW) / 2;
      const imgY = afterNameY;
      const imgR = W * 0.04;

      // Animated glow ring behind image
      const glowPulse = 0.6 + 0.4 * Math.sin(t * Math.PI * 2);
      ctx.save();
      ctx.shadowColor = style.accent;
      ctx.shadowBlur = 40 * glowPulse;
      ctx.fillStyle = `${style.accent}15`;
      ctx.beginPath();
      ctx.roundRect(imgX - 4, imgY - 4, drawW + 8, drawH + 8, imgR + 4);
      ctx.fill();
      ctx.restore();

      // Image shadow
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 20;

      // Clip and draw image
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, drawW, drawH, imgR);
      ctx.clip();
      ctx.drawImage(img, imgX, imgY, drawW, drawH);

      // Subtle gradient overlay on image (bottom fade)
      const imgOverlay = ctx.createLinearGradient(imgX, imgY + drawH * 0.6, imgX, imgY + drawH);
      imgOverlay.addColorStop(0, "transparent");
      imgOverlay.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = imgOverlay;
      ctx.fillRect(imgX, imgY, drawW, drawH);
      ctx.restore();

      // Neon border on image
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.save();
      const imgBorderGrad = ctx.createLinearGradient(imgX, imgY, imgX + drawW, imgY + drawH);
      imgBorderGrad.addColorStop(0, `${style.accent}60`);
      imgBorderGrad.addColorStop(0.5, `${style.accentEnd}40`);
      imgBorderGrad.addColorStop(1, `${style.accent}60`);
      ctx.strokeStyle = imgBorderGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, drawW, drawH, imgR);
      ctx.stroke();
      ctx.restore();

      imgBottom = imgY + drawH + H * 0.02;
    } else {
      const phW = W * 0.6;
      const phH = H * 0.22;
      ctx.fillStyle = `${style.accent}08`;
      ctx.beginPath();
      ctx.roundRect((W - phW) / 2, afterNameY, phW, phH, W * 0.035);
      ctx.fill();
      ctx.font = `${W * 0.08}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = style.subtext;
      ctx.fillText("\u{1F4E6}", W / 2, afterNameY + phH / 2 + W * 0.025);
      imgBottom = afterNameY + phH + H * 0.02;
    }

    // ════════════════════════════════════════════════════════════════
    // PRICE — glowing accent text
    // ════════════════════════════════════════════════════════════════
    const priceText = `\u20A6${product.price.toLocaleString()}`;
    ctx.font = `900 ${W * 0.07}px Inter, sans-serif`;
    ctx.textAlign = "center";

    // Price glow
    ctx.save();
    ctx.shadowColor = style.accent;
    ctx.shadowBlur = 20;
    ctx.fillStyle = style.accent;
    ctx.fillText(priceText, W / 2, imgBottom + H * 0.035);
    ctx.restore();

    // Crisp price on top
    ctx.fillStyle = style.accent;
    ctx.fillText(priceText, W / 2, imgBottom + H * 0.035);

    // ════════════════════════════════════════════════════════════════
    // DESCRIPTION — muted elegant text
    // ════════════════════════════════════════════════════════════════
    const descY = imgBottom + H * 0.065;
    if (product.description) {
      ctx.font = `400 ${W * 0.025}px Inter, sans-serif`;
      ctx.fillStyle = style.subtext;
      ctx.textAlign = "center";
      const descLines = wrapText(ctx, product.description, W * 0.68);
      descLines.forEach((line, i) => {
        ctx.fillText(line, W / 2, descY + i * W * 0.036);
      });
    }

    // ── Category badge ─────────────────────────────────────────────
    const catY = descY + (product.description ? W * 0.038 * Math.min(wrapText(ctx, product.description || "", W * 0.68).length, 3) + H * 0.008 : 0);
    if (product.category) {
      ctx.font = `600 ${W * 0.016}px Inter, sans-serif`;
      const catText = product.category.toUpperCase();
      const catW = ctx.measureText(catText).width;
      const catPad = W * 0.018;

      // Gradient badge
      ctx.save();
      const badgeGrad = ctx.createLinearGradient(
        (W - catW - catPad * 2) / 2, catY,
        (W - catW - catPad * 2) / 2 + catW + catPad * 2, catY
      );
      badgeGrad.addColorStop(0, `${style.accent}25`);
      badgeGrad.addColorStop(1, `${style.accentEnd}20`);
      ctx.fillStyle = badgeGrad;
      ctx.beginPath();
      ctx.roundRect((W - catW - catPad * 2) / 2, catY, catW + catPad * 2, W * 0.03, 16);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = style.accent;
      ctx.textAlign = "center";
      ctx.fillText(catText, W / 2, catY + W * 0.021);
    }

    // ════════════════════════════════════════════════════════════════
    // BOTTOM CTA SECTION
    // ════════════════════════════════════════════════════════════════
    const bottomY = H * 0.84;

    // Decorative line
    const lineGrad = ctx.createLinearGradient(W * 0.25, bottomY - H * 0.015, W * 0.75, bottomY - H * 0.015);
    lineGrad.addColorStop(0, "transparent");
    lineGrad.addColorStop(0.3, `${style.accent}30`);
    lineGrad.addColorStop(0.7, `${style.accentEnd}30`);
    lineGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.2, bottomY - H * 0.015);
    ctx.lineTo(W * 0.8, bottomY - H * 0.015);
    ctx.stroke();

    // "ORDER NOW ON" heading
    ctx.fillStyle = style.text;
    ctx.globalAlpha = 0.85;
    ctx.font = `700 ${W * 0.02}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("ORDER NOW ON", W / 2, bottomY);
    ctx.globalAlpha = 1;

    // Store name
    ctx.fillStyle = style.subtext;
    ctx.font = `500 ${W * 0.019}px Inter, sans-serif`;
    ctx.fillText(store.name, W / 2, bottomY + W * 0.032);

    // ── CTA Button ─────────────────────────────────────────────────
    const btnW = W * 0.52;
    const btnH = W * 0.082;
    const btnY = bottomY + W * 0.055;

    // Animated pulse rings
    for (let ring = 0; ring < 2; ring++) {
      const ringPhase = (t * 2 + ring * 0.5) % 1;
      const ringScale = 1 + ringPhase * 0.15;
      const ringAlpha = 0.3 * (1 - ringPhase);
      ctx.strokeStyle = ring === 0 ? style.accent : style.accentEnd;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = ringAlpha;
      ctx.beginPath();
      ctx.roundRect(
        (W - btnW * ringScale) / 2,
        btnY - (btnH * (ringScale - 1)) / 2,
        btnW * ringScale,
        btnH * ringScale,
        14
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Button fill with gradient
    ctx.save();
    ctx.shadowColor = style.accent;
    ctx.shadowBlur = 20;
    const btnGrad = ctx.createLinearGradient((W - btnW) / 2, btnY, (W + btnW) / 2, btnY);
    btnGrad.addColorStop(0, style.accent);
    btnGrad.addColorStop(0.5, style.accentEnd);
    btnGrad.addColorStop(1, style.accent);
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect((W - btnW) / 2, btnY, btnW, btnH, 14);
    ctx.fill();
    ctx.restore();

    // Button shimmer sweep
    ctx.save();
    ctx.beginPath();
    ctx.roundRect((W - btnW) / 2, btnY, btnW, btnH, 14);
    ctx.clip();
    const shimmerGrad = ctx.createLinearGradient(
      (W - btnW) / 2 + btnW * (t * 2 - 0.3), btnY,
      (W - btnW) / 2 + btnW * (t * 2 + 0.1), btnY
    );
    shimmerGrad.addColorStop(0, "transparent");
    shimmerGrad.addColorStop(0.5, "rgba(255,255,255,0.2)");
    shimmerGrad.addColorStop(1, "transparent");
    ctx.fillStyle = shimmerGrad;
    ctx.fillRect((W - btnW) / 2, btnY, btnW, btnH);
    ctx.restore();

    // Button text
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${W * 0.027}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Shop Now", W / 2, btnY + btnH * 0.62);

    // ── Store URL ──────────────────────────────────────────────────
    ctx.fillStyle = `${style.subtext}60`;
    ctx.font = `400 ${W * 0.015}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`stallhq.com/${store.slug}`, W / 2, H * 0.955);
  }, [product, store, format, style]);

  // Draw on mount and when settings change
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

      for (let i = 0; i < 20; i++) {
        await drawCard(canvas, i);
        offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
        offCtx.drawImage(canvas, 0, 0);
        const frame = document.createElement("canvas");
        frame.width = offscreen.width;
        frame.height = offscreen.height;
        frame.getContext("2d")!.drawImage(offscreen, 0, 0);
        gifFrames.push({ canvas: frame, delay: 150 });
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

  const handleShareWhatsAppStatus = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSharing(true);
    try {
      await drawCard(canvas, 0);

      if (navigator.share && navigator.canShare) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );
        if (blob) {
          const file = new File([blob], `${product.name.replace(/[^a-z0-9]/gi, "-")}-stallhq.png`, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: product.name,
              text: `${product.name} - \u20A6${product.price.toLocaleString()} on ${store.name}`,
            });
            setDownloadedType("image");
            setTimeout(() => setDownloadedType(null), 2000);
            return;
          }
        }
      }

      canvas.toBlob(async (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${product.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-stallhq.png`;
          a.click();
          URL.revokeObjectURL(url);
          window.location.href = "whatsapp://status";
          setDownloadedType("image");
          setTimeout(() => setDownloadedType(null), 2000);
        }
        setSharing(false);
      }, "image/png");
    } catch {
      setSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 10000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.88)", backdropFilter: "blur(20px)",
      padding: "1rem",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--bg-primary)", border: "1px solid var(--border-subtle)",
        borderRadius: "1.25rem", maxWidth: "56rem", width: "100%",
        maxHeight: "90vh", overflow: "auto", position: "relative",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-subtle)",
          position: "sticky", top: 0, background: "var(--bg-primary)", zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: "2rem", height: "2rem", borderRadius: "0.5rem",
              background: `linear-gradient(135deg, ${style.accent}, ${style.accentEnd})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={14} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Promo Card</h2>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Create & download promo cards</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: "1.75rem", height: "1.75rem", borderRadius: "50%",
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            color: "var(--text-muted)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", padding: "1.25rem" }}>
          {/* Preview */}
          <div style={{ flex: "1 1 280px", minWidth: "260px" }}>
            <div style={{
              borderRadius: "0.75rem", overflow: "hidden",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-card)",
              aspectRatio: `${format.width}/${format.height}`,
              maxHeight: "58vh",
            }}>
              <canvas ref={canvasRef} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          </div>

          {/* Controls */}
          <div style={{ flex: "1 1 240px", minWidth: "240px", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Format */}
            <div>
              <label style={labelStyle}><Layout size={11} /> Format</label>
              <div style={{ display: "flex", gap: "0.375rem" }}>
                {(Object.entries(CARD_FORMATS) as [CardFormat, (typeof CARD_FORMATS)[CardFormat]][]).map(([key, fmt]) => (
                  <button key={key} onClick={() => setCardFormat(key)} style={{
                    flex: 1, padding: "0.5rem", borderRadius: "0.5rem",
                    border: `1.5px solid ${cardFormat === key ? style.accent : "var(--border-subtle)"}`,
                    background: cardFormat === key ? `${style.accent}15` : "var(--bg-card)",
                    color: cardFormat === key ? style.accent : "var(--text-secondary)",
                    cursor: "pointer", fontSize: "0.625rem", fontWeight: 600,
                    textAlign: "center", transition: "all 0.15s",
                  }}>
                    <div style={{ fontSize: "1rem", marginBottom: "0.125rem" }}>{fmt.icon}</div>
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div>
              <label style={labelStyle}><Palette size={11} /> Style</label>
              <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                {(Object.entries(CARD_STYLES) as [CardStyle, (typeof CARD_STYLES)[CardStyle]][]).map(([key, s]) => (
                  <button key={key} onClick={() => setCardStyle(key)} style={{
                    padding: "0.375rem 0.75rem", borderRadius: "0.375rem",
                    border: `1.5px solid ${cardStyle === key ? s.accent : "var(--border-subtle)"}`,
                    background: cardStyle === key ? `${s.accent}15` : "var(--bg-card)",
                    color: cardStyle === key ? s.accent : "var(--text-secondary)",
                    cursor: "pointer", fontSize: "0.6875rem", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: "0.25rem",
                    transition: "all 0.15s",
                  }}>
                    <div style={{
                      width: "0.625rem", height: "0.625rem", borderRadius: "50%",
                      background: `linear-gradient(135deg, ${s.accent}, ${s.accentEnd})`,
                    }} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div style={{
              padding: "0.75rem", borderRadius: "0.5rem",
              background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {[
                  ["Product", product.name],
                  ["Price", `\u20A6${product.price.toLocaleString()}`],
                  ["Store", store.name],
                  ["Size", `${format.width} \u00D7 ${format.height}`],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: label === "Price" ? "var(--glow-green)" : undefined, maxWidth: "60%", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Download buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button onClick={handleDownloadImage} disabled={downloading} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                padding: "0.75rem", borderRadius: "0.5rem",
                background: `linear-gradient(135deg, ${style.accent}, ${style.accentEnd})`,
                color: "white", fontSize: "0.8125rem", fontWeight: 700,
                border: "none", cursor: "pointer", minHeight: "44px",
                opacity: downloading ? 0.7 : 1, transition: "all 0.15s",
              }}>
                {downloadedType === "image" ? <Check size={16} /> : <Image size={16} />}
                {downloadedType === "image" ? "Downloaded!" : "Download as Image"}
              </button>

              <button onClick={handleDownloadGif} disabled={downloading} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                padding: "0.75rem", borderRadius: "0.5rem",
                background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)", fontSize: "0.8125rem", fontWeight: 600,
                cursor: "pointer", minHeight: "44px",
                opacity: downloading ? 0.7 : 1, transition: "all 0.15s",
              }}>
                {downloadedType === "gif" ? <Check size={16} /> : <Film size={16} />}
                {downloadedType === "gif" ? "Downloaded!" : downloading ? "Generating..." : "Download as GIF"}
              </button>
            </div>

            {/* WhatsApp Status Share */}
            <div style={{
              padding: "0.75rem", borderRadius: "0.5rem",
              background: "rgba(37,211,102,0.06)",
              border: "1px solid rgba(37,211,102,0.15)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
                <Share2 size={12} style={{ color: "#25d366" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Share to WhatsApp Status</span>
              </div>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                Download image and share directly to your WhatsApp Status
              </p>
              <button onClick={handleShareWhatsAppStatus} disabled={sharing} style={{
                width: "100%", padding: "0.625rem", borderRadius: "0.5rem",
                background: "#25d366", border: "none",
                color: "white", fontSize: "0.75rem", fontWeight: 600,
                cursor: "pointer", minHeight: "40px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                opacity: sharing ? 0.7 : 1, transition: "all 0.15s",
              }}>
                {sharing ? <RefreshCw size={12} className="animate-spin" /> : <Share2 size={12} />}
                {sharing ? "Preparing..." : "📱 Share to Status"}
              </button>
            </div>

            {/* Auto-post */}
            {(store.whatsapp_number || store.instagram_handle) && (
              <div style={{
                padding: "0.75rem", borderRadius: "0.5rem",
                background: "rgba(168,133,247,0.04)",
                border: "1px solid rgba(168,133,247,0.12)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
                  <Sparkles size={12} style={{ color: "var(--glow-purple)" }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Auto-Post</span>
                </div>
                <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  Send this card to your WhatsApp or post to Instagram
                </p>
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  {store.whatsapp_number && (
                    <AutoPostButton platform="whatsapp" productId={product.id} storeSlug={store.slug} />
                  )}
                  {store.instagram_handle && (
                    <AutoPostButton platform="instagram" productId={product.id} storeSlug={store.slug} />
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

function AutoPostButton({ platform, productId, storeSlug }: {
  platform: "whatsapp" | "instagram"; productId: string; storeSlug: string;
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
    } catch {} finally { setPosting(false); }
  };

  const colors = platform === "whatsapp"
    ? { bg: "rgba(37,211,102,0.12)", border: "rgba(37,211,102,0.25)", text: "#25d366", icon: "\uD83D\uDCAC" }
    : { bg: "rgba(225,48,108,0.12)", border: "rgba(225,48,108,0.25)", text: "#e1306c", icon: "\uD83D\uDCF8" };

  return (
    <button onClick={handlePost} disabled={posting || posted} style={{
      flex: 1, padding: "0.375rem", borderRadius: "0.375rem",
      background: posted ? `${colors.text}15` : colors.bg,
      border: `1px solid ${posted ? `${colors.text}30` : colors.border}`,
      color: colors.text, fontSize: "0.6875rem", fontWeight: 600,
      cursor: posting || posted ? "default" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem",
      opacity: posting ? 0.7 : 1, transition: "all 0.15s",
    }}>
      {posted ? <Check size={10} /> : posting ? <RefreshCw size={10} className="animate-spin" /> : null}
      {posted ? "Sent!" : posting ? "Sending..." : `${colors.icon} ${platform === "whatsapp" ? "WhatsApp" : "Instagram"}`}
    </button>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.25rem",
  fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)",
  marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.04em",
};
