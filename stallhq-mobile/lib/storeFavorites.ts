import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ExpoCrypto from "expo-crypto";
import { WEB_API_URL } from "./auth";

const DEVICE_ID_KEY = "stallhq_device_id";

export async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = ExpoCrypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export async function addStoreFavorite(storeId: string): Promise<boolean> {
  try {
    const deviceId = await getDeviceId();
    const res = await fetch(`${WEB_API_URL}/api/store-favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, store_id: storeId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function removeStoreFavorite(storeId: string): Promise<boolean> {
  try {
    const deviceId = await getDeviceId();
    const res = await fetch(`${WEB_API_URL}/api/store-favorites`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, store_id: storeId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getStoreFavorites(): Promise<any[]> {
  try {
    const deviceId = await getDeviceId();
    const res = await fetch(`${WEB_API_URL}/api/store-favorites?device_id=${deviceId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.favorites || [];
  } catch {
    return [];
  }
}

export async function isStoreFavorited(storeId: string): Promise<boolean> {
  const favs = await getStoreFavorites();
  return favs.some((f: any) => f.store_id === storeId);
}
