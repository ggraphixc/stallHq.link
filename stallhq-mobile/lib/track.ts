import { supabase } from "./supabase";

export type TrackEventType = "visit" | "whatsapp_click" | "product_view";

interface TrackOptions {
  productId?: string | null;
  metadata?: Record<string, unknown> | null;
}

let DeviceModule: any = null;

async function getDevice() {
  if (!DeviceModule) {
    try {
      DeviceModule = await import("expo-device");
    } catch {
      DeviceModule = { osName: "unknown", osVersion: "", modelName: "" };
    }
  }
  return DeviceModule;
}

/**
 * Fire an analytics event for a store. Never throws / blocks UX —
 * tracking is best-effort and fails silently.
 *
 * Includes device fingerprinting metadata so duplicate visits from
 * the same device within 5 minutes are suppressed at the DB level
 * via a partial unique index (analytics_store_device_time).
 */
export async function trackEvent(
  storeId: string,
  eventType: TrackEventType,
  options?: TrackOptions
): Promise<void> {
  try {
    const Device = await getDevice();
    const deviceFingerprint = [
      Device.osName,
      Device.osVersion,
      Device.modelName,
    ].join("|");

    // Suppress duplicate visit within 5 minutes from same device
    if (eventType === "visit") {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("analytics")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("event_type", "visit")
        .eq("metadata->>device", deviceFingerprint)
        .gte("created_at", fiveMinAgo);

      if (recent && Number(recent) > 0) return;
    }

    const { error } = await supabase.from("analytics").insert({
      store_id: storeId,
      event_type: eventType,
      product_id: options?.productId ?? null,
      metadata: {
        ...options?.metadata,
        device: deviceFingerprint,
        platform: Device.osName,
      },
    });
    if (error) {
      console.warn(`[analytics] ${eventType} failed:`, error.message);
    }
  } catch (err) {
    console.warn("[analytics] tracking error:", err);
  }
}

/** A customer opened the store page. */
export function trackStoreVisit(storeId: string): void {
  trackEvent(storeId, "visit");
}

/** A customer tapped an order/contact action (WhatsApp). */
export function trackStoreClick(
  storeId: string,
  channel: "whatsapp" | "instagram" = "whatsapp"
): void {
  trackEvent(storeId, "whatsapp_click", {
    metadata: { channel },
  });
}
