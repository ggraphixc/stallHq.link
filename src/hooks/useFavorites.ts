"use client";

import { useState, useEffect, useCallback } from "react";

function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("stallhq_device_id");
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
    localStorage.setItem("stallhq_device_id", id);
  }
  return id;
}

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load favorites from API
  const loadFavorites = useCallback(async () => {
    try {
      const deviceId = getDeviceId();
      if (!deviceId) return;
      const res = await fetch(`/api/favorites?device_id=${deviceId}`);
      const data = await res.json();
      setFavoriteIds(new Set(data.favorites?.map((f: { product_id: string }) => f.product_id) || []));
    } catch {
      // silent
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  const toggleFavorite = useCallback(async (productId: string, storeId: string) => {
    const deviceId = getDeviceId();
    if (!deviceId) return;

    const isFav = favoriteIds.has(productId);

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      if (isFav) {
        await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_id: deviceId, product_id: productId }),
        });
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_id: deviceId, product_id: productId, store_id: storeId }),
        });
      }
    } catch {
      // Revert on error
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (isFav) next.add(productId);
        else next.delete(productId);
        return next;
      });
    }
  }, [favoriteIds]);

  const isFavorite = useCallback((productId: string) => favoriteIds.has(productId), [favoriteIds]);

  return { favoriteIds, toggleFavorite, isFavorite, loaded, favoritesCount: favoriteIds.size };
}
