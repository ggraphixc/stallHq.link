"use client";

import { useEffect } from "react";

const BRANDING_CACHE_KEY = "stallhq_branding";
const BRANDING_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface BrandingCache {
  logo_url: string | null;
  favicon_url: string | null;
  platform_name: string;
  timestamp: number;
}

function getCachedBranding(): BrandingCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BRANDING_CACHE_KEY);
    if (!raw) return null;
    const data: BrandingCache = JSON.parse(raw);
    if (Date.now() - data.timestamp > BRANDING_CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCachedBranding(data: BrandingCache) {
  try {
    localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function DynamicBranding() {
  useEffect(() => {
    const cached = getCachedBranding();
    if (cached) {
      applyBranding(cached);
      return;
    }

    fetch("/api/branding")
      .then((r) => r.json())
      .then((data) => {
        const branding: BrandingCache = {
          logo_url: data.logo_url || null,
          favicon_url: data.favicon_url || null,
          platform_name: data.platform_name || "stallHq",
          timestamp: Date.now(),
        };
        setCachedBranding(branding);
        applyBranding(branding);
      })
      .catch(() => {
        // use defaults
      });
  }, []);

  return null;
}

function applyBranding(branding: BrandingCache) {
  // Update favicon
  if (branding.favicon_url) {
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = branding.favicon_url;

    // Also update apple-touch-icon
    let apple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (!apple) {
      apple = document.createElement("link");
      apple.rel = "apple-touch-icon";
      document.head.appendChild(apple);
    }
    apple.href = branding.favicon_url;

    // Also update og:image
    let og = document.querySelector("meta[property='og:image']") as HTMLMetaElement;
    if (!og) {
      og = document.createElement("meta");
      og.setAttribute("property", "og:image");
      document.head.appendChild(og);
    }
    og.content = branding.favicon_url;
  }

  // Update document title with platform name
  if (branding.platform_name && branding.platform_name !== "stallHq") {
    const currentTitle = document.title;
    // Replace "stallHq" with custom name in titles
    document.title = currentTitle.replace(/stallHq/gi, branding.platform_name);
  }
}
