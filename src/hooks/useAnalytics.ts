"use client";

import { useCallback } from "react";

interface TrackEventOptions {
  storeId: string;
  eventType: "visit" | "whatsapp_click" | "product_view";
  productId?: string;
  metadata?: Record<string, unknown>;
}

export function useAnalytics() {
  const trackEvent = useCallback(
    async ({ storeId, eventType, productId, metadata }: TrackEventOptions) => {
      try {
        await fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_id: storeId,
            event_type: eventType,
            product_id: productId,
            metadata,
          }),
        });
      } catch (error) {
        // Silently fail - analytics should not block user experience
        console.error("Analytics tracking failed:", error);
      }
    },
    []
  );

  const trackVisit = useCallback(
    (storeId: string) => {
      trackEvent({ storeId, eventType: "visit" });
    },
    [trackEvent]
  );

  const trackWhatsAppClick = useCallback(
    (storeId: string) => {
      trackEvent({ storeId, eventType: "whatsapp_click" });
    },
    [trackEvent]
  );

  const trackProductView = useCallback(
    (storeId: string, productId: string) => {
      trackEvent({ storeId, eventType: "product_view", productId });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackVisit,
    trackWhatsAppClick,
    trackProductView,
  };
}
