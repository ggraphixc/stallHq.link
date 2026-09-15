import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { supabase, Store, Product, Order } from "./supabase";

// ─── Cache keys ────────────────────────────────────────────────────────

const KEYS = {
  STORES: "stallhq_cache_stores",
  PRODUCTS: "stallhq_cache_products",
  ORDER_QUEUE: "stallhq_order_queue",
  CACHE_META: "stallhq_cache_meta",
} as const;

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ─── Online/offline state ─────────────────────────────────────────────

let _isOnline = true;
const _listeners: ((online: boolean) => void)[] = [];

export function isOnline() {
  return _isOnline;
}

export function onOnlineChange(cb: (online: boolean) => void) {
  _listeners.push(cb);
  return () => {
    const idx = _listeners.indexOf(cb);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}

// Initialize network listener (call once at app start)
export function initNetworkListener() {
  NetInfo.addEventListener((state) => {
    const online = !!state.isConnected && !!state.isInternetReachable;
    if (online !== _isOnline) {
      _isOnline = online;
      _listeners.forEach((cb) => cb(online));
      if (online) flushOrderQueue(); // auto-submit queued orders
    }
  });
}

// ─── Store/Products cache ─────────────────────────────────────────────

interface CacheMeta {
  storesAt: number;
  productsAt: number;
  [key: string]: number;
}

async function getCacheMeta(): Promise<CacheMeta> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CACHE_META);
    return raw ? JSON.parse(raw) : { storesAt: 0, productsAt: 0 };
  } catch {
    return { storesAt: 0, productsAt: 0 };
  }
}

async function setCacheMeta(meta: Partial<CacheMeta>) {
  const current = await getCacheMeta();
  await AsyncStorage.setItem(KEYS.CACHE_META, JSON.stringify({ ...current, ...meta }));
}

/** Cache stores for offline browsing */
export async function cacheStores(stores: Store[]) {
  try {
    await AsyncStorage.setItem(KEYS.STORES, JSON.stringify(stores));
    await setCacheMeta({ storesAt: Date.now() });
  } catch {}
}

/** Get stores — fresh from API if online, cached if offline or stale */
export async function getStores(forceRefresh = false): Promise<Store[]> {
  const meta = await getCacheMeta();
  const cacheValid = Date.now() - meta.storesAt < CACHE_TTL;

  if (!forceRefresh && !_isOnline) {
    // Offline: return cached
    const raw = await AsyncStorage.getItem(KEYS.STORES);
    return raw ? JSON.parse(raw) : [];
  }

  if (!forceRefresh && cacheValid) {
    // Cache is fresh — use it, but also refresh in background
    const raw = await AsyncStorage.getItem(KEYS.STORES);
    const cached = raw ? JSON.parse(raw) : [];
    // Background refresh
    refreshStoresFromAPI().catch(() => {});
    return cached;
  }

  // Fetch fresh
  try {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("setup_complete", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const stores = (data || []) as Store[];
    await cacheStores(stores);
    return stores;
  } catch {
    // Fallback to cache
    const raw = await AsyncStorage.getItem(KEYS.STORES);
    return raw ? JSON.parse(raw) : [];
  }
}

async function refreshStoresFromAPI() {
  try {
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("setup_complete", true)
      .order("created_at", { ascending: false });
    if (data) await cacheStores(data as Store[]);
  } catch {}
}

/** Cache products for a store */
export async function cacheProducts(storeId: string, products: Product[]) {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PRODUCTS);
    const all: Record<string, Product[]> = raw ? JSON.parse(raw) : {};
    all[storeId] = products;
    await AsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(all));
    await setCacheMeta({ productsAt: Date.now() });
  } catch {}
}

/** Get products for a store */
export async function getProducts(storeId: string, forceRefresh = false): Promise<Product[]> {
  const meta = await getCacheMeta();
  const cacheValid = Date.now() - meta.productsAt < CACHE_TTL;

  if (!forceRefresh && !_isOnline) {
    const raw = await AsyncStorage.getItem(KEYS.PRODUCTS);
    const all: Record<string, Product[]> = raw ? JSON.parse(raw) : {};
    return all[storeId] || [];
  }

  if (!forceRefresh && cacheValid) {
    const raw = await AsyncStorage.getItem(KEYS.PRODUCTS);
    const all: Record<string, Product[]> = raw ? JSON.parse(raw) : {};
    return all[storeId] || [];
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .eq("in_stock", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const products = (data || []) as Product[];
    await cacheProducts(storeId, products);
    return products;
  } catch {
    const raw = await AsyncStorage.getItem(KEYS.PRODUCTS);
    const all: Record<string, Product[]> = raw ? JSON.parse(raw) : {};
    return all[storeId] || [];
  }
}

// ─── Order Queue (offline → online) ───────────────────────────────────

interface QueuedOrder {
  id: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: { product_id: string; product_name: string; price: number; quantity: number }[];
  total: number;
  notes?: string;
  queued_at: string;
}

/** Queue an order when offline */
export async function queueOrder(order: Omit<QueuedOrder, "id" | "queued_at">) {
  const queued: QueuedOrder = {
    ...order,
    id: `qo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    queued_at: new Date().toISOString(),
  };

  const raw = await AsyncStorage.getItem(KEYS.ORDER_QUEUE);
  const queue: QueuedOrder[] = raw ? JSON.parse(raw) : [];
  queue.push(queued);
  await AsyncStorage.setItem(KEYS.ORDER_QUEUE, JSON.stringify(queue));

  return queued;
}

/** Get the current order queue */
export async function getOrderQueue(): Promise<QueuedOrder[]> {
  const raw = await AsyncStorage.getItem(KEYS.ORDER_QUEUE);
  return raw ? JSON.parse(raw) : [];
}

/** Clear a queued order (after successful submission) */
export async function clearQueuedOrder(id: string) {
  const raw = await AsyncStorage.getItem(KEYS.ORDER_QUEUE);
  const queue: QueuedOrder[] = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(
    KEYS.ORDER_QUEUE,
    JSON.stringify(queue.filter((o) => o.id !== id))
  );
}

/** Submit all queued orders (called when coming back online) */
async function flushOrderQueue() {
  const queue = await getOrderQueue();
  if (!queue.length) return;

  for (const order of queue) {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_APP_URL || "https://hqlink.vercel.app"}/api/orders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_id: order.store_id,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_email: order.customer_email,
            items: order.items,
            total: order.total,
            notes: order.notes,
          }),
        }
      );
      if (res.ok) {
        await clearQueuedOrder(order.id);
      }
    } catch {
      // Will retry on next online event
    }
  }
}

/** Submit a single order (online or queue) */
export async function submitOrder(order: {
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: { product_id: string; product_name: string; price: number; quantity: number }[];
  total: number;
  notes?: string;
}): Promise<{ success: boolean; queued?: boolean; orderId?: string }> {
  if (!_isOnline) {
    const queued = await queueOrder(order);
    return { success: true, queued: true, orderId: queued.id };
  }

  try {
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_APP_URL || "https://hqlink.vercel.app"}/api/orders`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      }
    );
    if (!res.ok) {
      // Network error during send — queue it
      const queued = await queueOrder(order);
      return { success: true, queued: true, orderId: queued.id };
    }
    const data = await res.json();
    return { success: true, orderId: data.id };
  } catch {
    const queued = await queueOrder(order);
    return { success: true, queued: true, orderId: queued.id };
  }
}
