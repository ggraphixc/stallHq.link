"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Download, Image, Film, Sparkles, Check,
  Palette, Layout, X, RefreshCw, Share2, AlertTriangle
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
  label: string; bgTop: string; bgBot: string; accent: string; accentEnd: string;
  orb1: string; orb2: string; orb3: string; text: string; subtext: string;
}> = {
  aurora:  { label: "Aurora",  bgTop: "#0b0820", bgBot: "#050410", accent: "#a855f7", accentEnd: "#06b6d4", orb1: "#7c3aed", orb2: "#0ea5e9", orb3: "#d946ef", text: "#f8fafc", subtext: "#cbd5e1" },
  neon:    { label: "Neon",    bgTop: "#1a0612", bgBot: "#080406", accent: "#f43f5e", accentEnd: "#f59e0b", orb1: "#ef4444", orb2: "#f59e0b", orb3: "#ec4899", text: "#fafafa", subtext: "#d4d4d8" },
  sunset:  { label: "Sunset",  bgTop: "#1f0814", bgBot: "#0a0306", accent: "#f97316", accentEnd: "#ec4899", orb1: "#f97316", orb2: "#ec4899", orb3: "#8b5cf6", text: "#fff7ed", subtext: "#fed7aa" },
  ocean:   { label: "Ocean",   bgTop: "#04101f", bgBot: "#020812", accent: "#06b6d4", accentEnd: "#3b82f6", orb1: "#06b6d4", orb2: "#3b82f6", orb3: "#8b5cf6", text: "#ecfeff", subtext: "#a5f3fc" },
  royal:   { label: "Royal",   bgTop: "#160624", bgBot: "#08030f", accent: "#c084fc", accentEnd: "#f472b6", orb1: "#a855f7", orb2: "#f472b6", orb3: "#818cf8", text: "#faf5ff", subtext: "#ddd6fe" },
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

/** rgba() string from a hex color + 0..1 alpha. */
function hexA(hex: string, a: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 3): string[] {
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
  return lines.slice(0, maxLines);
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
  // square "post" format — tighter layout than the tall status/story formats
  const compact = format.height / format.width < 1.3;

  const drawCard = useCallback(async (canvas: HTMLCanvasElement, animPhase = 0) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = format.width;
    const H = format.height;
    canvas.width = W;
    canvas.height = H;

    const t = animPhase / 60; // normalized 0..1 animation progress

    // ════════════════════════════════════════════════════════════════
    // BASE — vibrant two-tone diagonal gradient
    // ════════════════════════════════════════════════════════════════
    const baseGrad = ctx.createLinearGradient(0, 0, W, H);
    baseGrad.addColorStop(0, style.bgTop);
    baseGrad.addColorStop(1, style.bgBot);
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, W, H);

    // ════════════════════════════════════════════════════════════════
    // AURORA ORBS — large soft drifting color clouds
    // ════════════════════════════════════════════════════════════════
    const drawOrb = (cx: number, cy: number, r: number, color: string, alpha: number) => {
      const rgb = hexToRgb(color);
      if (!rgb) return;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`);
      g.addColorStop(0.45, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.35})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    };
    drawOrb(W * 0.8 + Math.sin(t * Math.PI * 2) * W * 0.06, H * 0.14 + Math.cos(t * Math.PI * 2) * H * 0.03, W * 0.62, style.orb1, 0.24);
    drawOrb(W * 0.16 + Math.cos(t * Math.PI * 2) * W * 0.05, H * 0.88 + Math.sin(t * Math.PI * 2) * H * 0.04, W * 0.56, style.orb2, 0.20);
    drawOrb(W * 0.5 + Math.sin(t * Math.PI * 4) * W * 0.05, H * 0.5 + Math.cos(t * Math.PI * 4) * H * 0.03, W * 0.46, style.orb3, 0.13);

    // ════════════════════════════════════════════════════════════════
    // HOLOGRAPHIC SHEEN — signature iridescent sweep (screen blend)
    // ════════════════════════════════════════════════════════════════
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const sweep = ((t * 1.4) % 1.5) - 0.25; // -0.25 .. 1.25
    const sx = -W * 0.4 + sweep * W * 1.8;
    const sheen = ctx.createLinearGradient(sx, 0, sx + W * 0.9, H);
    const holo = ["#ff0080", "#a855f7", "#3b82f6", "#06b6d4", "#10b981", "#facc15", "#ff0080"];
    holo.forEach((c, i) => {
      const rgb = hexToRgb(c);
      if (rgb) sheen.addColorStop(i / (holo.length - 1), `rgba(${rgb.r},${rgb.g},${rgb.b},0.13)`);
    });
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // ── Particle / bokeh starfield ──────────────────────────────────
    for (let i = 0; i < 46; i++) {
      const px = seededRandom(i) * W;
      const py = seededRandom(i + 100) * H;
      const pSize = seededRandom(i + 200) * 2.2 + 0.6;
      const flicker = 0.25 + 0.75 * Math.abs(Math.sin(t * Math.PI * 2 + i * 0.7));
      ctx.fillStyle = `rgba(255,255,255,${flicker * 0.45})`;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // ════════════════════════════════════════════════════════════════
    // FROSTED GLASS PANEL
    // ════════════════════════════════════════════════════════════════
    const m = W * 0.055;
    const cardW = W - m * 2;
    const cardH = H - m * 2;
    const cardR = W * 0.06;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(m, m, cardW, cardH, cardR);
    ctx.clip();
    // frosted fill
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    ctx.fillRect(m, m, cardW, cardH);
    // top sheen highlight
    const innerG = ctx.createLinearGradient(0, m, 0, m + cardH * 0.5);
    innerG.addColorStop(0, "rgba(255,255,255,0.07)");
    innerG.addColorStop(1, "transparent");
    ctx.fillStyle = innerG;
    ctx.fillRect(m, m, cardW, cardH);
    ctx.restore();

    // Holographic animated rainbow border
    ctx.save();
    const bAlpha = 0.5 + 0.25 * Math.sin(t * Math.PI * 2);
    const borderGrad = ctx.createLinearGradient(m, m, m + cardW, m + cardH);
    borderGrad.addColorStop(0, hexA(style.accent, bAlpha));
    borderGrad.addColorStop(0.5, hexA(style.accentEnd, bAlpha));
    borderGrad.addColorStop(1, hexA(style.orb3, bAlpha));
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = style.accent;
    ctx.shadowBlur = 22 + 8 * Math.sin(t * Math.PI * 2);
    ctx.beginPath();
    ctx.roundRect(m, m, cardW, cardH, cardR);
    ctx.stroke();
    ctx.restore();

    // ════════════════════════════════════════════════════════════════
    // CONTENT
    // ════════════════════════════════════════════════════════════════
    const padX = m + W * 0.065;
    const contentW = W - padX * 2;

    // ── Top row: store avatar (left) + "Exclusive" pill (right) ──────
    const topY = m + W * 0.055;
    const avatarD = W * 0.075;
    const avatarX = padX + avatarD / 2;
    const avatarCY = topY + avatarD / 2;

    // avatar glow ring
    ctx.save();
    ctx.shadowColor = style.accent;
    ctx.shadowBlur = 16;
    const avatarGrad = ctx.createLinearGradient(avatarX - avatarD / 2, avatarCY - avatarD / 2, avatarX + avatarD / 2, avatarCY + avatarD / 2);
    avatarGrad.addColorStop(0, style.accent);
    avatarGrad.addColorStop(1, style.accentEnd);
    ctx.fillStyle = avatarGrad;
    ctx.beginPath();
    ctx.arc(avatarX, avatarCY, avatarD / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // store initial
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${avatarD * 0.42}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(store.name.charAt(0).toUpperCase(), avatarX, avatarCY + 1);
    ctx.textBaseline = "alphabetic";

    // store name next to avatar
    ctx.fillStyle = style.text;
    ctx.font = `700 ${W * 0.026}px Inter, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(store.name, avatarX + avatarD / 2 + W * 0.022, avatarCY - W * 0.004);
    ctx.fillStyle = style.subtext;
    ctx.font = `500 ${W * 0.017}px Inter, sans-serif`;
    ctx.fillText("StallHq Store", avatarX + avatarD / 2 + W * 0.022, avatarCY + W * 0.022);

    // "Exclusive" pill — right aligned
    const tagText = "EXCLUSIVE";
    ctx.font = `800 ${W * 0.016}px Inter, sans-serif`;
    const tagW = ctx.measureText(tagText).width;
    const tagPad = W * 0.022;
    const tagH = W * 0.038;
    const tagX = W - padX - tagW - tagPad * 2;
    const tagY = avatarCY - tagH / 2;
    ctx.save();
    const tagGrad = ctx.createLinearGradient(tagX, tagY, tagX + tagW + tagPad * 2, tagY);
    tagGrad.addColorStop(0, hexA(style.accent, 0.35));
    tagGrad.addColorStop(1, hexA(style.accentEnd, 0.35));
    ctx.fillStyle = tagGrad;
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagW + tagPad * 2, tagH, tagH / 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tagText, tagX + (tagW + tagPad * 2) / 2, tagY + tagH / 2 + 0.5);
    ctx.textBaseline = "alphabetic";

    // ── Product image (visual anchor) ───────────────────────────────
    const img = product.image_url ? await loadImageBlob(product.image_url) : null;
    const imgMaxW = W * 0.8;
    const imgMaxH = compact ? H * 0.3 : H * 0.32;
    let imgW = 0, imgH = 0, imgX = 0, imgY = 0;
    if (img) {
      const aspect = img.naturalWidth / img.naturalHeight;
      if (aspect > imgMaxW / imgMaxH) { imgW = imgMaxW; imgH = imgMaxW / aspect; }
      else { imgH = imgMaxH; imgW = imgMaxH * aspect; }
      imgX = (W - imgW) / 2;
    }
    const imgTop = topY + avatarD + W * (compact ? 0.05 : 0.06);
    imgY = imgTop;

    if (img) {
      const imgR = W * 0.045;
      const glowPulse = 0.6 + 0.4 * Math.sin(t * Math.PI * 2);
      // holo glow ring behind image
      ctx.save();
      ctx.shadowColor = style.accent;
      ctx.shadowBlur = 45 * glowPulse;
      const ringGrad = ctx.createLinearGradient(imgX, imgY, imgX + imgW, imgY + imgH);
      ringGrad.addColorStop(0, hexA(style.accent, 0.5));
      ringGrad.addColorStop(0.5, hexA(style.accentEnd, 0.4));
      ringGrad.addColorStop(1, hexA(style.orb3, 0.5));
      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.roundRect(imgX - W * 0.012, imgY - W * 0.012, imgW + W * 0.024, imgH + W * 0.024, imgR + W * 0.012);
      ctx.fill();
      ctx.restore();

      // image shadow + clip
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 50;
      ctx.shadowOffsetY = 18;
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgW, imgH, imgR);
      ctx.clip();
      ctx.drawImage(img, imgX, imgY, imgW, imgH);
      // bottom fade overlay for text legibility
      const fade = ctx.createLinearGradient(imgX, imgY + imgH * 0.55, imgX, imgY + imgH);
      fade.addColorStop(0, "transparent");
      fade.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = fade;
      ctx.fillRect(imgX, imgY, imgW, imgH);
      ctx.restore();

      // hairline holo border on image
      ctx.save();
      const ibGrad = ctx.createLinearGradient(imgX, imgY, imgX + imgW, imgY + imgH);
      ibGrad.addColorStop(0, hexA(style.accent, 0.7));
      ibGrad.addColorStop(1, hexA(style.accentEnd, 0.5));
      ctx.strokeStyle = ibGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgW, imgH, imgR);
      ctx.stroke();
      ctx.restore();
    }

    // ── Product name (bold gradient) ────────────────────────────────
    let nameY = img ? imgY + imgH + W * 0.05 : imgTop + W * 0.06;
    if (!img) {
      // placeholder box when no image
      const phW = W * 0.62, phH = compact ? H * 0.22 : H * 0.26;
      const phX = (W - phW) / 2;
      ctx.save();
      ctx.fillStyle = hexA(style.accent, 0.08);
      ctx.beginPath();
      ctx.roundRect(phX, imgTop, phW, phH, W * 0.04);
      ctx.fill();
      ctx.strokeStyle = hexA(style.accent, 0.25);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = style.subtext;
      ctx.font = `${W * 0.07}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("\u{1F4E6}", W / 2, imgTop + phH / 2 + W * 0.022);
      nameY = imgTop + phH + W * 0.05;
    }

    const nameFontSize = compact ? W * 0.07 : W * 0.085;
    ctx.font = `900 ${nameFontSize}px Inter, sans-serif`;
    ctx.textAlign = "center";
    const nameLines = wrapText(ctx, product.name.toUpperCase(), contentW, 2);

    const textGrad = ctx.createLinearGradient(W * 0.2, nameY, W * 0.8, nameY + nameLines.length * nameFontSize * 1.02);
    textGrad.addColorStop(0, style.accent);
    textGrad.addColorStop(0.5, "#ffffff");
    textGrad.addColorStop(1, style.accentEnd);

    ctx.save();
    ctx.shadowColor = style.accent;
    ctx.shadowBlur = 24;
    ctx.fillStyle = textGrad;
    nameLines.forEach((line, i) => {
      ctx.fillText(line, W / 2, nameY + i * nameFontSize * 1.02);
    });
    ctx.restore();
    // crisp second pass
    ctx.fillStyle = textGrad;
    nameLines.forEach((line, i) => {
      ctx.fillText(line, W / 2, nameY + i * nameFontSize * 1.02);
    });

    let afterNameY = nameY + nameLines.length * nameFontSize * 1.02 + W * 0.025;

    // ── Price + description block ───────────────────────────────────
    const priceText = `\u20A6${product.price.toLocaleString()}`;
    const priceFontSize = compact ? W * 0.06 : W * 0.072;
    ctx.font = `900 ${priceFontSize}px Inter, sans-serif`;
    ctx.textAlign = "center";

    ctx.save();
    ctx.shadowColor = style.accent;
    ctx.shadowBlur = 18;
    ctx.fillStyle = style.accentEnd;
    ctx.fillText(priceText, W / 2, afterNameY + priceFontSize);
    ctx.restore();
    ctx.fillStyle = style.accentEnd;
    ctx.fillText(priceText, W / 2, afterNameY + priceFontSize);

    // "Offer price" eyebrow above the number
    ctx.fillStyle = style.subtext;
    ctx.font = `700 ${W * 0.016}px Inter, sans-serif`;
    ctx.fillText("OFFER PRICE", W / 2, afterNameY - W * 0.006);

    let descY = afterNameY + priceFontSize + W * 0.04;
    if (product.description) {
      ctx.font = `400 ${W * 0.024}px Inter, sans-serif`;
      ctx.fillStyle = style.subtext;
      const descLines = wrapText(ctx, product.description, contentW * 0.92, 2);
      descLines.forEach((line, i) => {
        ctx.fillText(line, W / 2, descY + i * W * 0.034);
      });
      descY += descLines.length * W * 0.034 + W * 0.02;
    }

    // category chip
    if (product.category) {
      const catText = product.category.toUpperCase();
      ctx.font = `700 ${W * 0.015}px Inter, sans-serif`;
      const catW = ctx.measureText(catText).width;
      const catPad = W * 0.02;
      const chipW = catW + catPad * 2;
      const chipH = W * 0.03;
      const chipX = (W - chipW) / 2;
      ctx.save();
      ctx.fillStyle = hexA(style.accent, 0.16);
      ctx.beginPath();
      ctx.roundRect(chipX, descY, chipW, chipH, chipH / 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = style.accent;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(catText, W / 2, descY + chipH / 2 + 0.5);
      ctx.textBaseline = "alphabetic";
    }

    // ════════════════════════════════════════════════════════════════
    // BOTTOM CTA (pinned)
    // ════════════════════════════════════════════════════════════════
    const btnW = W * 0.56;
    const btnH = W * 0.085;
    const btnX = (W - btnW) / 2;
    const btnY = H - m - W * 0.13 - btnH;

    // pulse rings
    for (let ring = 0; ring < 2; ring++) {
      const rp = (t * 1.8 + ring * 0.5) % 1;
      const scale = 1 + rp * 0.14;
      ctx.strokeStyle = ring === 0 ? hexA(style.accent, 0.3 * (1 - rp)) : hexA(style.accentEnd, 0.3 * (1 - rp));
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(
        (W - btnW * scale) / 2,
        btnY - (btnH * (scale - 1)) / 2,
        btnW * scale,
        btnH * scale,
        btnH * 0.5
      );
      ctx.stroke();
    }

    // button body — full holographic gradient
    ctx.save();
    ctx.shadowColor = style.accent;
    ctx.shadowBlur = 24;
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
    btnGrad.addColorStop(0, style.accent);
    btnGrad.addColorStop(0.5, style.accentEnd);
    btnGrad.addColorStop(1, style.orb3);
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, btnH * 0.5);
    ctx.fill();
    ctx.restore();

    // shimmer sweep across button
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, btnH * 0.5);
    ctx.clip();
    const shX = btnX + btnW * ((t * 2) % 1.6 - 0.3);
    const shGrad = ctx.createLinearGradient(shX - btnW * 0.2, btnY, shX + btnW * 0.1, btnY);
    shGrad.addColorStop(0, "transparent");
    shGrad.addColorStop(0.5, "rgba(255,255,255,0.28)");
    shGrad.addColorStop(1, "transparent");
    ctx.fillStyle = shGrad;
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.restore();

    // button label
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${W * 0.028}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Shop Now", W / 2, btnY + btnH / 2 + 1);
    ctx.textBaseline = "alphabetic";

    // "Order now on" eyebrow above button
    ctx.fillStyle = hexA(style.text, 0.7);
    ctx.font = `700 ${W * 0.018}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("ORDER NOW ON", W / 2, btnY - W * 0.028);

    // store url footer
    ctx.fillStyle = hexA(style.subtext, 0.65);
    ctx.font = `500 ${W * 0.017}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`stallhq.com/${store.slug}`, W / 2, H - m - W * 0.055);
  }, [product, store, format, style, compact]);

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
  const [error, setError] = useState<string | null>(null);

  const handlePost = async () => {
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/promo/auto-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, storeSlug, platform }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setPosted(true);
      } else {
        setError(data.error || `Failed (${res.status})`);
      }
    } catch {
      setError("Network error — check your connection and retry.");
    } finally {
      setPosting(false);
    }
  };

  const colors = platform === "whatsapp"
    ? { bg: "rgba(37,211,102,0.12)", border: "rgba(37,211,102,0.25)", text: "#25d366", icon: "\uD83D\uDCAC" }
    : { bg: "rgba(225,48,108,0.12)", border: "rgba(225,48,108,0.25)", text: "#e1306c", icon: "\uD83D\uDCF8" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", flex: 1 }}>
      <button onClick={handlePost} disabled={posting || posted} style={{
        padding: "0.375rem", borderRadius: "0.375rem",
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
      {error && (
        <button
          onClick={() => { setError(null); handlePost(); }}
          title={error}
          style={{
            display: "flex", alignItems: "flex-start", gap: "0.25rem",
            padding: "0.3rem 0.5rem", borderRadius: "0.3rem",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#ef4444", fontSize: "0.625rem", fontWeight: 500,
            cursor: "pointer", lineHeight: 1.3, textAlign: "left",
          }}
        >
          <AlertTriangle size={10} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{error}</span>
        </button>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.25rem",
  fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)",
  marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.04em",
};
