import { WEB_API_URL } from "./config";

/**
 * Subscribe to a price drop alert for a product.
 * Returns true if subscribed, false on error.
 */
export async function subscribePriceAlert(
  productId: string,
  deviceId: string,
  targetPrice?: number
): Promise<boolean> {
  try {
    const res = await fetch(`${WEB_API_URL}/api/alerts/price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        device_id: deviceId,
        target_price: targetPrice || 0,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Unsubscribe from a price drop alert.
 */
export async function unsubscribePriceAlert(
  productId: string,
  deviceId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${WEB_API_URL}/api/alerts/price?product_id=${productId}&device_id=${deviceId}`,
      { method: "DELETE" }
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Check if user has an active price alert for a product.
 */
export async function hasPriceAlert(
  productId: string,
  deviceId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${WEB_API_URL}/api/alerts/price?product_id=${productId}&device_id=${deviceId}`
    );
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.alert;
  } catch {
    return false;
  }
}

/**
 * Subscribe to a back-in-stock alert for a product.
 */
export async function subscribeStockAlert(
  productId: string,
  deviceId: string
): Promise<boolean> {
  try {
    const res = await fetch(`${WEB_API_URL}/api/alerts/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        device_id: deviceId,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Unsubscribe from a back-in-stock alert.
 */
export async function unsubscribeStockAlert(
  productId: string,
  deviceId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${WEB_API_URL}/api/alerts/stock?product_id=${productId}&device_id=${deviceId}`,
      { method: "DELETE" }
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Check if user has an active stock alert for a product.
 */
export async function hasStockAlert(
  productId: string,
  deviceId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${WEB_API_URL}/api/alerts/stock?product_id=${productId}&device_id=${deviceId}`
    );
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.alert;
  } catch {
    return false;
  }
}
