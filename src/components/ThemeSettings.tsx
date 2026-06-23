"use client";

import { useState } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { Store, StoreTheme } from "@/types";
import { X, Loader2, Palette, Lock } from "lucide-react";
import { canCustomizeTheme } from "@/lib/subscription";

interface ThemeSettingsProps {
  store: Store;
  onClose: () => void;
  onSaved: (store: Store) => void;
}

const PRESET_THEMES = [
  { name: "Default", theme: null },
  { name: "Ocean", theme: { primaryColor: "#0ea5e9", accentColor: "#06b6d4", backgroundColor: "#0c1222", cardBackground: "#1e293b", textColor: "#f8fafc" } },
  { name: "Forest", theme: { primaryColor: "#22c55e", accentColor: "#10b981", backgroundColor: "#0a1a0f", cardBackground: "#14291d", textColor: "#f8fafc" } },
  { name: "Sunset", theme: { primaryColor: "#f97316", accentColor: "#ef4444", backgroundColor: "#1a0f0a", cardBackground: "#2d1f15", textColor: "#f8fafc" } },
  { name: "Lavender", theme: { primaryColor: "#a855f7", accentColor: "#ec4899", backgroundColor: "#0f0a1a", cardBackground: "#1f152d", textColor: "#f8fafc" } },
  { name: "Midnight", theme: { primaryColor: "#6366f1", accentColor: "#8b5cf6", backgroundColor: "#0a0a14", cardBackground: "#14142a", textColor: "#f8fafc" } },
];

const FONT_OPTIONS = [
  { label: "Default", heading: "", body: "" },
  { label: "Inter", heading: "Inter, sans-serif", body: "Inter, sans-serif" },
  { label: "Space Grotesk", heading: "Space Grotesk, sans-serif", body: "Inter, sans-serif" },
  { label: "Playfair Display", heading: "Playfair Display, serif", body: "Inter, sans-serif" },
  { label: "DM Sans", heading: "DM Sans, sans-serif", body: "DM Sans, sans-serif" },
  { label: "Outfit", heading: "Outfit, sans-serif", body: "Outfit, sans-serif" },
];

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  marginBottom: "0.25rem",
};

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
};

export function ThemeSettings({ store, onClose, onSaved }: ThemeSettingsProps) {
  const [loading, setLoading] = useState(false);
  const { error: showError, success: showSuccess, confirm } = useAlert();
  const [selectedPreset, setSelectedPreset] = useState<string>(store.theme ? "custom" : "Default");
  const [theme, setTheme] = useState<StoreTheme>(
    store.theme || { primaryColor: "#a855f7", accentColor: "#06b6d4", backgroundColor: "#0a0a0f", cardBackground: "#16161f", textColor: "#f8fafc" }
  );
  const [selectedFont, setSelectedFont] = useState<string>(
    store.theme?.fontHeading ? FONT_OPTIONS.find(f => f.heading === store.theme!.fontHeading)?.label || "Custom" : "Default"
  );

  const handlePresetSelect = (preset: (typeof PRESET_THEMES)[0]) => {
    setSelectedPreset(preset.name);
    if (preset.theme) setTheme(preset.theme);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: selectedPreset === "Default" ? null : theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save theme");
      onSaved(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div className="slide-up" style={{ position: "relative", width: "100%", maxWidth: "32rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Palette size={18} style={{ color: "var(--glow-purple)" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Store Theme</h2>
          </div>
          <button onClick={onClose} style={{ width: "2.75rem", height: "2.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Preset Themes */}
          <div>
            <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.75rem" }}>Preset Themes</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 90px), 1fr))", gap: "0.5rem" }}>
              {PRESET_THEMES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  style={{
                    ...glassCard,
                    padding: "0.75rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    borderColor: selectedPreset === preset.name ? "var(--glow-purple)" : "var(--border-subtle)",
                    background: selectedPreset === preset.name ? "rgba(168,133,247,0.08)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.5rem" }}>
                    <div style={{ width: "1rem", height: "1rem", borderRadius: "50%", background: preset.theme?.primaryColor || "#a855f7" }} />
                    <div style={{ width: "1rem", height: "1rem", borderRadius: "50%", background: preset.theme?.accentColor || "#06b6d4" }} />
                  </div>
                  <span style={{ fontSize: "0.6875rem" }}>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          {selectedPreset !== "Default" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3 style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Custom Colors</h3>

              {!canCustomizeTheme(store) ? (
                <div style={{
                  ...glassCard,
                  padding: "1.5rem",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "rgba(168,133,247,0.04)",
                  borderColor: "rgba(168,133,247,0.15)",
                }}>
                  <div style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "0.5rem",
                    background: "linear-gradient(135deg, rgba(168,133,247,0.15), rgba(6,182,212,0.1))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Lock size={14} style={{ color: "var(--glow-purple)" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                      Premium Feature
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                      Custom brand colors are available on the <strong style={{ color: "var(--glow-purple)" }}>Growth</strong> and <strong style={{ color: "var(--glow-purple)" }}>Premium</strong> plans.
                    </p>
                  </div>
                  <a
                    href="/upgrade"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.5rem 1rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: "var(--glow-purple)",
                      color: "white",
                      borderRadius: "0.5rem",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                  >
                    Upgrade Plan
                  </a>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))", gap: "0.75rem" }}>
                  {[
                    { label: "Primary Color", field: "primaryColor" as const },
                    { label: "Accent Color", field: "accentColor" as const },
                    { label: "Background", field: "backgroundColor" as const },
                    { label: "Card Background", field: "cardBackground" as const },
                  ].map(({ label, field }) => (
                    <div key={field}>
                      <label style={labelStyle}>{label}</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <input
                          type="color"
                          value={theme[field] || "#a855f7"}
                          onChange={(e) => setTheme({ ...theme, [field]: e.target.value })}
                          style={{ width: "2rem", height: "2rem", borderRadius: "0.25rem", border: "none", cursor: "pointer", padding: 0 }}
                        />
                        <input
                          type="text"
                          value={theme[field] || "#a855f7"}
                          onChange={(e) => setTheme({ ...theme, [field]: e.target.value })}
                          className="ambient-input"
                          style={{ flex: 1, padding: "0.375rem 0.5rem", fontSize: "0.75rem" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview — only show when custom colors are allowed */}
              {canCustomizeTheme(store) && (
                <div style={{ ...glassCard, padding: "1rem" }}>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Preview</p>
                  <div style={{ borderRadius: "0.5rem", padding: "1rem", background: theme.backgroundColor, color: theme.textColor }}>
                    <div style={{ width: "100%", height: "2rem", borderRadius: "0.25rem", background: theme.primaryColor, marginBottom: "0.5rem" }} />
                    <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: theme.cardBackground }}>
                      <div style={{ width: "4rem", height: "1rem", borderRadius: "0.25rem", background: theme.accentColor, marginBottom: "0.5rem" }} />
                      <div style={{ width: "6rem", height: "0.75rem", borderRadius: "0.25rem", background: "rgba(255,255,255,0.2)" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Font Selection */}
          {canCustomizeTheme(store) && (
            <div>
              <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.75rem" }}>Typography</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 90px), 1fr))", gap: "0.5rem" }}>
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.label}
                    onClick={() => {
                      setSelectedFont(font.label);
                      setTheme({ ...theme, fontHeading: font.heading || undefined, fontBody: font.body || undefined });
                    }}
                    style={{
                      ...glassCard,
                      padding: "0.625rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      borderColor: selectedFont === font.label ? "var(--glow-purple)" : "var(--border-subtle)",
                      background: selectedFont === font.label ? "rgba(168,133,247,0.08)" : "rgba(255,255,255,0.02)",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", fontFamily: font.heading || "inherit" }}>{font.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="glow-button"
            style={{ width: "100%", padding: "0.75rem", fontSize: "0.8125rem", opacity: loading ? 0.5 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                Saving...
              </span>
            ) : "Save Theme"}
          </button>
        </div>
      </div>
    </div>
  );
}
