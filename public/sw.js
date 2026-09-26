// HabitTrack PWA Service Worker
const CACHE_NAME = "habittrack-cache-v1";
const OFFLINE_URL = "/dashboard";

// Static routes & assets to cache on install for offline capability
const PRECACHE_ASSETS = [
  "/",
  "/dashboard",
  "/habits",
  "/calendar",
  "/expenses",
  "/exams",
  "/flashcards",
  "/manifest.webmanifest",
  "/icon",
  "/apple-icon",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Cache assets resiliently (don't fail install if a route redirects or is missing)
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            fetch(url).then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests (mutations handled by offline action queue)
  if (request.method !== "GET") {
    return;
  }

  // Bypass chrome-extension and external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip caching for auth token endpoints or real-time polling if needed
  if (url.pathname.startsWith("/api/auth/")) {
    return;
  }

  // For HTML navigation requests (pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const dashboardFallback = await caches.match(OFFLINE_URL);
          if (dashboardFallback) return dashboardFallback;
          return caches.match("/");
        })
    );
    return;
  }

  // For static assets: Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
