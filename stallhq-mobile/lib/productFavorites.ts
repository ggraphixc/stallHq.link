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

export async function addProductFavorite(productId: string, storeId: string): Promise<boolean> {
  try {
    const deviceId = await getDeviceId();
    const res = await fetch(`${WEB_API_URL}/api/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, product_id: productId, store_id: storeId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function removeProductFavorite(productId: string): Promise<boolean> {
  try {
    const deviceId = await getDeviceId();
    const res = await fetch(`${WEB_API_URL}/api/favorites`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, product_id: productId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getProductFavorites(): Promise<any[]> {
  try {
    const deviceId = await getDeviceId();
    const res = await fetch(`${WEB_API_URL}/api/favorites?device_id=${deviceId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.favorites || [];
  } catch {
    return [];
  }
}

export async function isProductFavorited(productId: string): Promise<boolean> {
  const favs = await getProductFavorites();
  return favs.some((f: any) => f.product_id === productId);
}
