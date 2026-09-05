import React, { useEffect, useState } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Heart } from "lucide-react-native";
import { Colors } from "../lib/theme";
import { addStoreFavorite, removeStoreFavorite, getStoreFavorites } from "../lib/storeFavorites";

export async function loadFavoriteSlugs(): Promise<string[]> {
  try {
    const favs = await getStoreFavorites();
    return favs.map((f: any) => f.stores?.slug || "").filter(Boolean);
  } catch {
    return [];
  }
}

export async function setStoreFavorite(_slug: string, _faved: boolean): Promise<string[]> {
  // Kept for backward compatibility — actual logic moved to StoreFavoriteButton
  return loadFavoriteSlugs();
}

export function StoreFavoriteButton({
  slug,
  storeId,
  size = 20,
  onChange,
}: {
  slug: string;
  storeId?: string;
  size?: number;
  onChange?: (faved: boolean) => void;
}) {
  const [faved, setFaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const favs = await getStoreFavorites();
        const isFav = favs.some((f: any) => f.stores?.slug === slug);
        if (active) { setFaved(isFav); setReady(true); }
      } catch {
        if (active) setReady(true);
      }
    })();
    return () => { active = false; };
  }, [slug]);

  const toggle = async () => {
    const next = !faved;
    setFaved(next);
    if (storeId) {
      if (next) {
        await addStoreFavorite(storeId);
      } else {
        await removeStoreFavorite(storeId);
      }
    }
    onChange?.(next);
  };

  return (
    <TouchableOpacity
      style={[styles.btn, faved && styles.btnActive]}
      onPress={toggle}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      disabled={!ready}
      accessibilityLabel={faved ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart size={size} color={faved ? Colors.red : Colors.textMuted} fill={faved ? Colors.red : "none"} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(6,6,11,0.6)",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  btnActive: { borderColor: "rgba(239,68,68,0.4)" },
});
