import { supabase } from "./supabase";

export type TrackEventType = "visit" | "whatsapp_click" | "product_view";

interface TrackOptions {
  productId?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Fire an analytics event for a store. Never throws / blocks UX —
 * tracking is best-effort and fails silently.
 */
export async function trackEvent(
  storeId: string,
  eventType: TrackEventType,
  options?: TrackOptions
): Promise<void> {
  try {
    const { error } = await supabase.from("analytics").insert({
      store_id: storeId,
      event_type: eventType,
      product_id: options?.productId ?? null,
      metadata: options?.metadata ?? null,
    });
    if (error) {
      console.warn(`[analytics] ${eventType} failed:`, error.message);
    }
  } catch (err) {
    // Analytics should never break the shopping experience
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
