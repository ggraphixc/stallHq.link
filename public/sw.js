/* ─── StallHQ Service Worker ──────────────────────────────────────────── */
/* Offline product browsing + background sync for orders                   */

const CACHE_NAME = "stallhq-v1";
const STATIC_CACHE = "stallhq-static-v1";

const STATIC_ASSETS = [
  "/",
  "/explore",
  "/offline",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static, stale-while-revalidate for store pages
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension
  if (request.method !== "GET" || url.protocol === "chrome-extension:") return;

  // API calls: network only (never cache auth/API responses)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: "Offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  // Store pages (/[slug]): stale-while-revalidate
  if (url.pathname.match(/^\/[^/]+$/) && url.pathname !== "/offline") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Static assets & pages: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to offline page for navigation
          if (request.mode === "navigate") {
            return caches.match("/offline");
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

// Background sync for queued orders
self.addEventListener("sync", (event) => {
  if (event.tag === "stallhq-order-queue") {
    event.waitUntil(syncQueuedOrders());
  }
});

async function syncQueuedOrders() {
  // The actual sync is handled by the React app when it detects online status.
  // This just ensures the SW doesn't block.
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: "SYNC_ORDERS" });
  });
}
