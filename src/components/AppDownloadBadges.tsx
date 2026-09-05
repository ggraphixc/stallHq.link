"use client";

import { useEffect, useState } from "react";
import { Play, Apple, Download, Clock } from "lucide-react";

interface PlatformInfo {
  version: string;
  minVersion: string;
  downloadUrl: string;
}

interface AppVersionResponse {
  android: PlatformInfo & { versionCode: number };
  ios: PlatformInfo;
  releaseNotes: string;
}

let cache: { data: AppVersionResponse | null; at: number } = { data: null, at: 0 };
const TTL = 5 * 60 * 1000;

async function fetchAppVersion(): Promise<AppVersionResponse | null> {
  const now = Date.now();
  if (cache.data && now - cache.at < TTL) return cache.data;
  try {
    const res = await fetch("/api/app-version");
    if (!res.ok) return cache.data;
    const data: AppVersionResponse = await res.json();
    cache = { data, at: now };
    return data;
  } catch {
    return cache.data;
  }
}

function StoreBadge({
  icon,
  storeLabel,
  storeName,
  version,
  url,
}: {
  icon: React.ReactNode;
  storeLabel: string;
  storeName: string;
  version: string;
  url: string;
}) {
  const inner = (
    <>
      <span style={{ flexShrink: 0, display: "flex" }}>{icon}</span>
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.15 }}>
        <span style={{ fontSize: "0.5625rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
          {storeLabel}
        </span>
        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{storeName}</span>
      </span>
      <span
        style={{
          fontSize: "0.625rem",
          fontWeight: 600,
          padding: "0.125rem 0.375rem",
          borderRadius: 999,
          border: "1px solid var(--border-subtle)",
          color: "var(--text-muted)",
          flexShrink: 0,
        }}
      >
        v{version}
      </span>
    </>
  );

  const baseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5625rem 0.75rem",
    borderRadius: "0.625rem",
    border: "1px solid var(--border-subtle)",
    background: "var(--bg-secondary)",
    minWidth: 150,
  };

  if (!url) {
    return (
      <div style={{ ...baseStyle, opacity: 0.55, cursor: "default" }} aria-disabled>
        {inner}
        <Clock size={11} style={{ color: "var(--text-muted)", marginLeft: "auto", flexShrink: 0 }} />
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...baseStyle, textDecoration: "none", transition: "border-color 0.2s, background 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--glow-purple)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
    >
      {inner}
      <Download size={11} style={{ color: "var(--text-muted)", marginLeft: "auto", flexShrink: 0 }} />
    </a>
  );
}

/**
 * Android + iOS app download badges with live versions from platform settings.
 * variant "section": full badges for the homepage app section.
 * variant "compact": small inline links for footers.
 */
export function AppDownloadBadges({ variant = "section" }: { variant?: "section" | "compact" }) {
  const [data, setData] = useState<AppVersionResponse | null>(null);

  useEffect(() => {
    fetchAppVersion().then(setData);
  }, []);

  if (!data) return null;

  const androidReady = !!data.android.downloadUrl;
  const iosReady = !!data.ios.downloadUrl;
  // Hide the whole widget until at least one platform is published.
  if (!androidReady && !iosReady && variant === "compact") return null;

  if (variant === "compact") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <Download size={11} /> Get the app
        </span>
        {androidReady && (
          <a href={data.android.downloadUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", textDecoration: "none" }}>
            Android <span style={{ color: "var(--text-muted)" }}>v{data.android.version}</span>
          </a>
        )}
        {iosReady && (
          <a href={data.ios.downloadUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", textDecoration: "none" }}>
            iOS <span style={{ color: "var(--text-muted)" }}>v{data.ios.version}</span>
          </a>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", justifyContent: "center" }}>
      <StoreBadge
        icon={<Play size={20} fill="currentColor" style={{ color: "var(--glow-green)" }} />}
        storeLabel={androidReady ? "Get it on" : "Coming soon on"}
        storeName="Android"
        version={data.android.version}
        url={data.android.downloadUrl}
      />
      <StoreBadge
        icon={<Apple size={20} style={{ color: "var(--text-primary)" }} />}
        storeLabel={iosReady ? "Download on the" : "Coming soon on the"}
        storeName="App Store"
        version={data.ios.version}
        url={data.ios.downloadUrl}
      />
    </div>
  );
}
