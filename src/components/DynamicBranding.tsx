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

/** Add cache-busting query param to force browser to reload favicon */
function cacheBustUrl(url: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${Date.now()}`;
}

export function DynamicBranding() {
  useEffect(() => {
    const cached = getCachedBranding();
    if (cached) {
      applyBranding(cached);
      // Still fetch fresh data in background to pick up admin changes
      fetchBrandingAndUpdate();
      return;
    }

    fetchBrandingAndUpdate();
  }, []);

  return null;
}

function fetchBrandingAndUpdate() {
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
}

function applyBranding(branding: BrandingCache) {
  // Update favicon
  if (branding.favicon_url) {
    // Remove any old dynamic favicon links we created
    document.querySelectorAll("link[data-dynamic-favicon]").forEach((el) => el.remove());

    const bustUrl = cacheBustUrl(branding.favicon_url);

    // Create new favicon link with cache-busting
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = bustUrl;
    link.setAttribute("data-dynamic-favicon", "true");
    document.head.appendChild(link);

    // Also update apple-touch-icon
    document.querySelectorAll("link[data-dynamic-apple-icon]").forEach((el) => el.remove());
    const apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    apple.href = bustUrl;
    apple.setAttribute("data-dynamic-apple-icon", "true");
    document.head.appendChild(apple);

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
