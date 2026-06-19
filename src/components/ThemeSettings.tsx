"use client";

import { useState } from "react";
import { Store, StoreTheme } from "@/types";
import { X, Loader2, Palette } from "lucide-react";

interface ThemeSettingsProps {
  store: Store;
  onClose: () => void;
  onSaved: (store: Store) => void;
}

const PRESET_THEMES = [
  {
    name: "Default",
    theme: null,
  },
  {
    name: "Ocean",
    theme: {
      primaryColor: "#0ea5e9",
      accentColor: "#06b6d4",
      backgroundColor: "#0c1222",
      cardBackground: "#1e293b",
      textColor: "#f8fafc",
    },
  },
  {
    name: "Forest",
    theme: {
      primaryColor: "#22c55e",
      accentColor: "#10b981",
      backgroundColor: "#0a1a0f",
      cardBackground: "#14291d",
      textColor: "#f8fafc",
    },
  },
  {
    name: "Sunset",
    theme: {
      primaryColor: "#f97316",
      accentColor: "#ef4444",
      backgroundColor: "#1a0f0a",
      cardBackground: "#2d1f15",
      textColor: "#f8fafc",
    },
  },
  {
    name: "Lavender",
    theme: {
      primaryColor: "#a855f7",
      accentColor: "#ec4899",
      backgroundColor: "#0f0a1a",
      cardBackground: "#1f152d",
      textColor: "#f8fafc",
    },
  },
  {
    name: "Midnight",
    theme: {
      primaryColor: "#6366f1",
      accentColor: "#8b5cf6",
      backgroundColor: "#0a0a14",
      cardBackground: "#14142a",
      textColor: "#f8fafc",
    },
  },
];

export function ThemeSettings({ store, onClose, onSaved }: ThemeSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string>(
    store.theme ? "custom" : "Default"
  );
  const [theme, setTheme] = useState<StoreTheme>(
    store.theme || {
      primaryColor: "#a855f7",
      accentColor: "#06b6d4",
      backgroundColor: "#0a0a0f",
      cardBackground: "#16161f",
      textColor: "#f8fafc",
    }
  );

  const handlePresetSelect = (preset: (typeof PRESET_THEMES)[0]) => {
    setSelectedPreset(preset.name);
    if (preset.theme) {
      setTheme(preset.theme);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: selectedPreset === "Default" ? null : theme,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save theme");
      }

      onSaved(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--glow-purple)]" />
            <h2 className="text-lg font-semibold">Store Theme</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Preset Themes */}
          <div>
            <h3 className="text-sm font-medium mb-3">Preset Themes</h3>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_THEMES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className={`p-3 rounded-xl border transition-all ${
                    selectedPreset === preset.name
                      ? "border-[var(--glow-purple)] bg-[var(--glow-purple)]/10"
                      : "border-[var(--border-subtle)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: preset.theme?.primaryColor || "#a855f7",
                      }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: preset.theme?.accentColor || "#06b6d4",
                      }}
                    />
                  </div>
                  <span className="text-xs">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          {selectedPreset !== "Default" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Custom Colors</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.primaryColor || "#a855f7"}
                      onChange={(e) =>
                        setTheme({ ...theme, primaryColor: e.target.value })
                      }
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={theme.primaryColor || "#a855f7"}
                      onChange={(e) =>
                        setTheme({ ...theme, primaryColor: e.target.value })
                      }
                      className="ambient-input flex-1 !py-1 !px-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.accentColor || "#06b6d4"}
                      onChange={(e) =>
                        setTheme({ ...theme, accentColor: e.target.value })
                      }
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={theme.accentColor || "#06b6d4"}
                      onChange={(e) =>
                        setTheme({ ...theme, accentColor: e.target.value })
                      }
                      className="ambient-input flex-1 !py-1 !px-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.backgroundColor || "#0a0a0f"}
                      onChange={(e) =>
                        setTheme({ ...theme, backgroundColor: e.target.value })
                      }
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={theme.backgroundColor || "#0a0a0f"}
                      onChange={(e) =>
                        setTheme({ ...theme, backgroundColor: e.target.value })
                      }
                      className="ambient-input flex-1 !py-1 !px-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Card Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.cardBackground || "#16161f"}
                      onChange={(e) =>
                        setTheme({ ...theme, cardBackground: e.target.value })
                      }
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={theme.cardBackground || "#16161f"}
                      onChange={(e) =>
                        setTheme({ ...theme, cardBackground: e.target.value })
                      }
                      className="ambient-input flex-1 !py-1 !px-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl border border-[var(--border-subtle)]">
                <p className="text-xs text-[var(--text-muted)] mb-2">Preview</p>
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: theme.backgroundColor,
                    color: theme.textColor,
                  }}
                >
                  <div
                    className="w-full h-8 rounded mb-2"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <div
                    className="p-3 rounded"
                    style={{ backgroundColor: theme.cardBackground }}
                  >
                    <div
                      className="w-16 h-4 rounded mb-2"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                    <div className="w-24 h-3 rounded bg-white/20" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="glow-button w-full disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Save Theme"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
