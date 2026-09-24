import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "stallhq:hiddenMsgs";

type Listener = (ids: Set<string>) => void;

let hidden = new Set<string>();
let loaded = false;
let pending: Promise<Set<string>> | null = null;
const listeners = new Set<Listener>();

function snapshot(): Set<string> {
  return new Set(hidden);
}

function notify(): void {
  const next = snapshot();
  listeners.forEach((l) => {
    try {
      l(next);
    } catch {}
  });
}

/** Read the persisted set once (idempotent). Resolves with a copy of the ids. */
export function loadHidden(): Promise<Set<string>> {
  if (loaded) return Promise.resolve(snapshot());
  if (pending) return pending;
  pending = (async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          hidden = new Set(parsed.filter((x): x is string => typeof x === "string"));
        }
      }
    } catch {}
    loaded = true;
    pending = null;
    notify();
    return snapshot();
  })();
  return pending;
}

/** Synchronous check against the last loaded snapshot. */
export function isHidden(id: string): boolean {
  return hidden.has(id);
}

/** Hide a message locally (delete-for-me) and persist the change. */
export async function hideMessage(id: string): Promise<void> {
  if (!id || hidden.has(id)) return;
  hidden.add(id);
  notify();
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(Array.from(hidden)));
  } catch {}
}

/** Listen for changes. Returns an unsubscribe function. */
export function subscribeHidden(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Load once on import so early `isHidden` checks are warm.
loadHidden();
