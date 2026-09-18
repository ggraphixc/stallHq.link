import { WEB_API_URL } from "./config";
import { supabase } from "./supabase";

export interface RecentlyViewedProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: string | null;
  store: {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
  };
}

/**
 * Record a product view in the recently viewed history.
 * Deduplicates views within the same hour.
 */
export async function trackProductView(
  productId: string,
  deviceId: string
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.access_token) {
      headers["x-access-token"] = session.access_token;
    }

    await fetch(`${WEB_API_URL}/api/products/recently-viewed`, {
      method: "POST",
      headers,
      body: JSON.stringify({ product_id: productId, device_id: deviceId }),
    });
  } catch (err) {
    console.warn("[recentlyViewed] track error:", err);
  }
}

/**
 * Fetch recently viewed products for this device.
 */
export async function getRecentlyViewed(
  deviceId: string,
  limit = 10
): Promise<RecentlyViewedProduct[]> {
  try {
    const res = await fetch(
      `${WEB_API_URL}/api/products/recently-viewed?device_id=${encodeURIComponent(deviceId)}&limit=${limit}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

/**
 * Fetch related products for a given product.
 */
export async function getRelatedProducts(
  productId: string,
  limit = 6
): Promise<RecentlyViewedProduct[]> {
  try {
    const res = await fetch(
      `${WEB_API_URL}/api/products/related?product_id=${productId}&limit=${limit}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

/**
 * Fetch trending products.
 */
export async function getTrendingProducts(
  limit = 8,
  days = 7
): Promise<RecentlyViewedProduct[]> {
  try {
    const res = await fetch(
      `${WEB_API_URL}/api/products/trending?limit=${limit}&days=${days}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}
