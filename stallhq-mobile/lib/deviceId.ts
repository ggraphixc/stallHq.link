import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_ID_KEY = "stallhq.device_id";

/**
 * Get or create a unique device ID for anonymous tracking.
 * Persisted in AsyncStorage so it survives app restarts.
 * Uses expo-crypto for UUID generation.
 */
export async function getDeviceId(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;

    // Generate new UUID
    const id = Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    // Fallback: use timestamp + random
    const fallback = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    return fallback;
  }
}
