"use client";

import { useState, useEffect, useCallback } from "react";

interface Branding {
  logo_url: string | null;
  favicon_url: string | null;
  platform_name: string;
}

const DEFAULT: Branding = { logo_url: null, favicon_url: null, platform_name: "stallHq" };

let cachedBranding: Branding | null = null;
let fetchPromise: Promise<Branding> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function fetchBranding(): Promise<Branding> {
  const now = Date.now();
  if (cachedBranding && now - lastFetchTime < CACHE_TTL) return Promise.resolve(cachedBranding);
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/branding")
    .then((r) => r.json())
    .then((data) => {
      cachedBranding = {
        logo_url: data.logo_url || null,
        favicon_url: data.favicon_url || null,
        platform_name: data.platform_name || "stallHq",
      };
      lastFetchTime = Date.now();
      try { localStorage.setItem("stallhq_branding", JSON.stringify(cachedBranding)); } catch {}
      return cachedBranding;
    })
    .catch(() => {
      cachedBranding = { ...DEFAULT };
      lastFetchTime = Date.now();
      return cachedBranding;
    })
    .finally(() => { fetchPromise = null; });

  return fetchPromise;
}

export function useBranding(): Branding & { refresh: () => Promise<void> } {
  const [branding, setBranding] = useState<Branding>(() => {
    if (cachedBranding) return cachedBranding;
    try {
      const stored = localStorage.getItem("stallhq_branding");
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT;
  });

  useEffect(() => {
    fetchBranding().then(setBranding);
  }, []);

  const refresh = useCallback(async () => {
    cachedBranding = null;
    lastFetchTime = 0;
    const fresh = await fetchBranding();
    setBranding(fresh);
  }, []);

  return { ...branding, refresh };
}

export function getPlatformNameSync(): string {
  if (cachedBranding?.platform_name) return cachedBranding.platform_name;
  try {
    const stored = localStorage.getItem("stallhq_branding");
    if (stored) return JSON.parse(stored).platform_name || "stallHq";
  } catch {}
  return "stallHq";
}
