import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type RoomPref = {
  archived?: boolean;
  muted?: boolean;
  blocked?: boolean;
  hidden?: boolean;
};

export type RoomPrefsMap = Record<string, RoomPref>;

const STORAGE_KEY = "stallhq:roomPrefs";

let cache: RoomPrefsMap = {};
let loaded = false;
const listeners = new Set<(prefs: RoomPrefsMap) => void>();

function snapshot(): RoomPrefsMap {
  return { ...cache };
}

function notify() {
  const snap = snapshot();
  listeners.forEach((l) => l(snap));
}

/** Read persisted room prefs once (idempotent) and notify subscribers. */
export async function loadRoomPrefs(): Promise<RoomPrefsMap> {
  if (loaded) return snapshot();
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        cache = parsed as RoomPrefsMap;
      }
    }
  } catch {}
  loaded = true;
  notify();
  return snapshot();
}

export function getRoomPref(roomId: string): RoomPref {
  return cache[roomId] ?? {};
}

/** Merge a partial pref for one room, persist it and notify listeners. */
export async function setRoomPref(roomId: string, partial: RoomPref): Promise<void> {
  cache = { ...cache, [roomId]: { ...getRoomPref(roomId), ...partial } };
  loaded = true;
  notify();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {}
}

/** Subscribe to pref changes. Callback receives an immutable snapshot. */
export function subscribeRoomPrefs(cb: (prefs: RoomPrefsMap) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** React hook: current room prefs map, kept in sync across the app. */
export function useRoomPrefs(): RoomPrefsMap {
  const [prefs, setPrefs] = useState<RoomPrefsMap>(() => snapshot());
  useEffect(() => {
    let alive = true;
    loadRoomPrefs().then((p) => {
      if (alive) setPrefs(p);
    });
    const unsub = subscribeRoomPrefs(setPrefs);
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return prefs;
}
