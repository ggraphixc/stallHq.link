// stallHq Design System — matches web globals.css exactly
// https://hqlink.vercel.app

export const Colors = {
  // Background Layers
  bg: "#06060b",
  bgSecondary: "#0e0e16",
  bgCard: "#13131d",
  bgCardHover: "#1a1a28",
  bgElevated: "#1e1e2e",

  // Glow Palette
  purple: "#a855f7",
  purpleDim: "rgba(168, 85, 247, 0.15)",
  green: "#10b981",
  greenDim: "rgba(16, 185, 129, 0.15)",
  cyan: "#06b6d4",
  cyanDim: "rgba(6, 182, 212, 0.15)",
  amber: "#f59e0b",
  amberDim: "rgba(245, 158, 11, 0.15)",
  red: "#ef4444",
  redDim: "rgba(239, 68, 68, 0.15)",
  blue: "#3b82f6",
  blueDim: "rgba(59, 130, 246, 0.15)",

  // Text
  text: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#4b5563",

  // Borders
  borderSubtle: "rgba(255, 255, 255, 0.06)",
  borderMedium: "rgba(255, 255, 255, 0.1)",
  borderGlow: "rgba(168, 85, 247, 0.25)",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  hero: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

// ─── Web Design System Styles ──────────────────────

// Glass card with gradient overlay (matches .glass-card)
export const glassCard = {
  background: "rgba(19, 19, 29, 0.6)",
  borderWidth: 1,
  borderColor: Colors.borderSubtle,
  borderRadius: BorderRadius.lg,
};

// Ambient card (matches .ambient-card)
export const ambientCard = {
  background: Colors.bgCard,
  borderWidth: 1,
  borderColor: Colors.borderSubtle,
  borderRadius: BorderRadius.xl,
};

// Primary button (matches .glow-button)
export const glowButton = {
  backgroundColor: Colors.purple,
  borderRadius: BorderRadius.lg,
  minHeight: 44,
};

// Secondary button (matches .glow-button-secondary)
export const glowButtonSecondary = {
  backgroundColor: Colors.bgCard,
  borderWidth: 1,
  borderColor: Colors.borderSubtle,
  borderRadius: BorderRadius.lg,
  minHeight: 44,
};

// Danger button (matches .glow-button-danger)
export const glowButtonDanger = {
  backgroundColor: Colors.redDim,
  borderWidth: 1,
  borderColor: "rgba(239, 68, 68, 0.2)",
  borderRadius: BorderRadius.lg,
  minHeight: 44,
};

// WhatsApp button
export const whatsappButton = {
  backgroundColor: "#25d366",
  borderRadius: BorderRadius.lg,
  minHeight: 44,
};

// Input (matches .ambient-input)
export const ambientInput = {
  backgroundColor: Colors.bgSecondary,
  borderWidth: 1,
  borderColor: Colors.borderSubtle,
  borderRadius: BorderRadius.lg,
  minHeight: 48,
  color: Colors.text,
};

// Label style (uppercase, small, tracked)
export const labelStyle = {
  fontSize: FontSize.xs as number,
  fontWeight: "600" as const,
  color: Colors.textSecondary,
  letterSpacing: 0.03,
  textTransform: "uppercase" as const,
};

// Icon button (matches .icon-button)
export const iconButton = {
  width: 44,
  height: 44,
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  borderRadius: BorderRadius.lg,
  backgroundColor: "transparent",
  borderWidth: 1,
  borderColor: "transparent",
  color: Colors.textSecondary,
};

// Badge styles
export const badges = {
  success: { backgroundColor: Colors.greenDim, color: Colors.green },
  warning: { backgroundColor: Colors.amberDim, color: Colors.amber },
  danger: { backgroundColor: Colors.redDim, color: Colors.red },
  info: { backgroundColor: Colors.blueDim, color: Colors.blue },
  neutral: { backgroundColor: Colors.bgCard, color: Colors.textSecondary },
  purple: { backgroundColor: Colors.purpleDim, color: Colors.purple },
};

// Gradient icon background (used in web stat cards)
export const gradientIconBg = {
  purple: { backgroundColor: Colors.purpleDim },
  green: { backgroundColor: Colors.greenDim },
  cyan: { backgroundColor: Colors.cyanDim },
  amber: { backgroundColor: Colors.amberDim },
};
