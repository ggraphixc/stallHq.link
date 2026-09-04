import React, { useEffect, useState } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Heart } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../lib/theme";

export const FAVORITES_KEY = "stallhq_favorites";

export async function loadFavoriteSlugs(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function setStoreFavorite(slug: string, faved: boolean): Promise<string[]> {
  const slugs = await loadFavoriteSlugs();
  const next = faved
    ? slugs.includes(slug) ? slugs : [...slugs, slug]
    : slugs.filter((s) => s !== slug);
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function StoreFavoriteButton({
  slug,
  size = 20,
  onChange,
}: {
  slug: string;
  size?: number;
  onChange?: (faved: boolean) => void;
}) {
  const [faved, setFaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadFavoriteSlugs().then((slugs) => {
      if (active) { setFaved(slugs.includes(slug)); setReady(true); }
    });
    return () => { active = false; };
  }, [slug]);

  const toggle = async () => {
    const next = !faved;
    setFaved(next);
    await setStoreFavorite(slug, next);
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
