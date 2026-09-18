import { WEB_API_URL } from "./config";

export interface StoreComparison {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  category: string | null;
  plan: string;
  verified: boolean;
  stats: {
    product_count: number;
    total_products: number;
    review_count: number;
    avg_rating: number;
    orders_30d: number;
    visits_30d: number;
    price_range: { min: number; max: number; avg: number };
  };
}

/**
 * Fetch store comparison data for 2-4 stores.
 */
export async function getStoreComparison(slugs: string[]): Promise<StoreComparison[]> {
  try {
    const ids = slugs.join(",");
    const res = await fetch(
      `${WEB_API_URL}/api/stores/compare?ids=${encodeURIComponent(ids)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.stores || [];
  } catch {
    return [];
  }
}
