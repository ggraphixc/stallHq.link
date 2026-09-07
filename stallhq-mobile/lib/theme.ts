// stallHq Design System — matches web globals.css exactly
// https://hqlink.vercel.app
//
// Dual-palette theme: `Colors` is a mutable singleton that holds whichever
// palette is active (dark or light). Existing `Colors.xxx` imports keep
// working. Styles that must react to theme changes should be created with
// `useThemeStyles(() => StyleSheet.create({ ... }))` — the hook re-runs the
// factory whenever the palette switches.
import { useMemo, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "system" | "light" | "dark";

export const palettes = {
  dark: {
    // Background Layers
    bg: "#06060b",
    bgSecondary: "#0e0e16",
    bgCard: "#13131d",
    bgCardHover: "#1a1a28",
    bgElevated: "#1e1e2e",
    glass: "rgba(19, 19, 29, 0.6)",
    purpleTint: "rgba(168, 85, 247, 0.06)",

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
  },
  light: {
    // Background Layers
    bg: "#f4f5fa",
    bgSecondary: "#ffffff",
    bgCard: "#ffffff",
    bgCardHover: "#eef0f6",
    bgElevated: "#ffffff",
    glass: "rgba(255, 255, 255, 0.92)",
    purpleTint: "rgba(124, 58, 237, 0.06)",

    // Glow Palette (darker for contrast on light backgrounds)
    purple: "#7c3aed",
    purpleDim: "rgba(124, 58, 237, 0.1)",
    green: "#059669",
    greenDim: "rgba(5, 150, 105, 0.1)",
    cyan: "#0e7490",
    cyanDim: "rgba(14, 116, 144, 0.1)",
    amber: "#b45309",
    amberDim: "rgba(180, 83, 9, 0.1)",
    red: "#dc2626",
    redDim: "rgba(220, 38, 38, 0.1)",
    blue: "#1d4ed8",
    blueDim: "rgba(29, 78, 216, 0.1)",

    // Text
    text: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",

    // Borders
    borderSubtle: "rgba(15, 23, 42, 0.08)",
    borderMedium: "rgba(15, 23, 42, 0.12)",
    borderGlow: "rgba(124, 58, 237, 0.28)",
  },
};

export type Palette = (typeof palettes)["dark"];

export const Colors: Palette = { ...palettes.dark };

// ─── Theme state (mode + system scheme) ─────────────────────────────
const STORAGE_KEY = "stallhq.theme.mode";

let mode: ThemeMode = "system";
let systemScheme: "light" | "dark" | null = null;
let version = 0;
const listeners = new Set<() => void>();

export function getIsDark(): boolean {
  if (mode === "light") return false;
  if (mode === "dark") return true;
  return systemScheme !== "light";
}

function applyPalette() {
  const dark = getIsDark();
  const p = dark ? palettes.dark : palettes.light;
  for (const key of Object.keys(p) as (keyof Palette)[]) {
    (Colors as Record<keyof Palette, string>)[key] = p[key];
  }
  version++;
  listeners.forEach((l) => l());
}

export function getThemeMode(): ThemeMode {
  return mode;
}

/** Set the user's theme preference ("system" follows the phone). Persisted. */
export function setThemeMode(next: ThemeMode) {
  if (mode === next) return;
  mode = next;
  AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  applyPalette();
}

/** Called by the app when the OS light/dark scheme changes. */
export function setSystemScheme(scheme: "light" | "dark" | null) {
  if (systemScheme === scheme) return;
  systemScheme = scheme;
  applyPalette();
}

/** Loads the persisted preference once at startup. */
export async function initTheme(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      mode = stored;
      applyPalette();
    }
  } catch {}
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
function getSnapshot() {
  return version;
}

/** Subscribe to theme changes (re-renders the calling component). */
export function useThemeVersion(): number {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Build styles dynamically so they follow the active palette.
 * Use inside a component: `const styles = useThemeStyles(() => StyleSheet.create({ ... }));`
 */
export function useThemeStyles<T>(factory: () => T): T {
  const v = useThemeVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, [v]);
}

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

// ─── Web Design System Styles ──────────────────────────────────────
// Style helpers are getter-backed so `...spread` inside useThemeStyles
// factories (and direct JSX usage) always read the ACTIVE palette.

// Glass card with gradient overlay (matches .glass-card)
export const glassCard = {
  get background() { return Colors.glass; },
  borderWidth: 1,
  get borderColor() { return Colors.borderSubtle; },
  borderRadius: BorderRadius.lg,
};

// Ambient card (matches .ambient-card)
export const ambientCard = {
  get backgroundColor() { return Colors.bgCard; },
  borderWidth: 1,
  get borderColor() { return Colors.borderSubtle; },
  borderRadius: BorderRadius.xl,
};

// Primary button (matches .glow-button)
export const glowButton = {
  get backgroundColor() { return Colors.purple; },
  borderRadius: BorderRadius.lg,
  minHeight: 44,
};

// Secondary button (matches .glow-button-secondary)
export const glowButtonSecondary = {
  get backgroundColor() { return Colors.bgCard; },
  borderWidth: 1,
  get borderColor() { return Colors.borderSubtle; },
  borderRadius: BorderRadius.lg,
  minHeight: 44,
};

// Danger button (matches .glow-button-danger)
export const glowButtonDanger = {
  get backgroundColor() { return Colors.redDim; },
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
  get backgroundColor() { return Colors.bgSecondary; },
  borderWidth: 1,
  get borderColor() { return Colors.borderSubtle; },
  borderRadius: BorderRadius.lg,
  minHeight: 48,
  get color() { return Colors.text; },
};

// Label style (uppercase, small, tracked)
export const labelStyle = {
  fontSize: FontSize.xs as number,
  fontWeight: "600" as const,
  get color() { return Colors.textSecondary; },
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
  get color() { return Colors.textSecondary; },
};

// Badge styles
export const badges = {
  success: { get backgroundColor() { return Colors.greenDim; }, get color() { return Colors.green; } },
  warning: { get backgroundColor() { return Colors.amberDim; }, get color() { return Colors.amber; } },
  danger: { get backgroundColor() { return Colors.redDim; }, get color() { return Colors.red; } },
  info: { get backgroundColor() { return Colors.blueDim; }, get color() { return Colors.blue; } },
  neutral: { get backgroundColor() { return Colors.bgCard; }, get color() { return Colors.textSecondary; } },
  purple: { get backgroundColor() { return Colors.purpleDim; }, get color() { return Colors.purple; } },
};

// Gradient icon background (used in web stat cards)
export const gradientIconBg = {
  purple: { get backgroundColor() { return Colors.purpleDim; } },
  green: { get backgroundColor() { return Colors.greenDim; } },
  cyan: { get backgroundColor() { return Colors.cyanDim; } },
  amber: { get backgroundColor() { return Colors.amberDim; } },
};