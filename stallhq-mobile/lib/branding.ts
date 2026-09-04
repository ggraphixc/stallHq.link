import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface PlatformBranding {
  logo_url: string | null;
  platform_name: string;
}

export const DEFAULT_BRANDING: PlatformBranding = {
  logo_url: null,
  platform_name: "stallHq",
};

const CACHE_KEY = "stallhq_platform_branding";

// Deduplicate concurrent fetches (multiple loaders mounting at once)
let cachedPromise: Promise<PlatformBranding> | null = null;

async function readCache(): Promise<PlatformBranding | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      logo_url: typeof parsed?.logo_url === "string" ? parsed.logo_url : null,
      platform_name:
        typeof parsed?.platform_name === "string" ? parsed.platform_name : "stallHq",
    };
  } catch {
    return null;
  }
}

async function fetchFromApi(): Promise<PlatformBranding> {
  try {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["logo_url", "platform_name"]);
    if (error) throw error;

    const settings: Record<string, unknown> = {};
    for (const row of data ?? []) settings[row.key] = row.value;

    const branding: PlatformBranding = {
      logo_url: settings.logo_url ? String(settings.logo_url) : null,
      platform_name: settings.platform_name
        ? String(settings.platform_name)
        : "stallHq",
    };
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(branding));
    } catch {}
    return branding;
  } catch {
    return DEFAULT_BRANDING;
  }
}

export function getBranding(): Promise<PlatformBranding> {
  if (!cachedPromise) cachedPromise = fetchFromApi();
  return cachedPromise;
}

/** Hook — returns cached branding instantly, then the fresh value from Supabase. */
export function useBranding(): PlatformBranding {
  const [branding, setBranding] = useState<PlatformBranding>(DEFAULT_BRANDING);

  useEffect(() => {
    let active = true;
    (async () => {
      const cached = await readCache();
      if (active && cached) setBranding(cached);
      const fresh = await getBranding();
      if (active) setBranding(fresh);
    })();
    return () => {
      active = false;
    };
  }, []);

  return branding;
}