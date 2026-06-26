"use client";

import { useState, useEffect } from "react";

interface Branding {
  logo_url: string | null;
  favicon_url: string | null;
}

let cachedBranding: Branding | null = null;
let fetchPromise: Promise<Branding> | null = null;

function fetchBranding(): Promise<Branding> {
  if (cachedBranding) return Promise.resolve(cachedBranding);
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/branding")
    .then((r) => r.json())
    .then((data) => {
      cachedBranding = {
        logo_url: data.logo_url || null,
        favicon_url: data.favicon_url || null,
      };
      return cachedBranding;
    })
    .catch(() => {
      cachedBranding = { logo_url: null, favicon_url: null };
      return cachedBranding;
    });

  return fetchPromise;
}

export function useBranding(): Branding {
  const [branding, setBranding] = useState<Branding>(
    cachedBranding || { logo_url: null, favicon_url: null }
  );

  useEffect(() => {
    fetchBranding().then(setBranding);
  }, []);

  return branding;
}
