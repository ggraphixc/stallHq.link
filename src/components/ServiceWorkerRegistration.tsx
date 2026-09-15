"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Listen for SW updates
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "activated") {
                  // SW updated — optionally notify user
                }
              });
            }
          });
        })
        .catch(() => {
          // SW registration failed — app still works without it
        });

      // Listen for sync messages from SW
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SYNC_ORDERS") {
          // Trigger order sync if the app has a sync handler
          window.dispatchEvent(new CustomEvent("stallhq:sync-orders"));
        }
      });
    }
  }, []);

  return null;
}
