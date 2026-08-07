/* =========================================================
   SKYLINE — Service Worker
   Caches the app shell (HTML/CSS/JS) so the site installs as
   a PWA and still loads (with the last-seen weather data)
   when offline. Live API calls always go to the network —
   we never want to serve stale weather data from cache.
   ========================================================= */

const CACHE_NAME = "skyline-weather-v1";

const APP_SHELL = [
  "index.html",
  "hourly.html",
  "forecast.html",
  "air-quality.html",
  "map.html",
  "common.js",
  "home.js",
  "hourly.js",
  "forecast.js",
  "air-quality.js",
  "map.js",
  "style.css",
  "manifest.json",
  "icon.png",
];

// --- Install: pre-cache the app shell ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// --- Activate: clear out any old cache versions ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// --- Fetch: cache-first for our own app shell files,
//     network-only (untouched) for everything else
//     (OpenWeatherMap API, map tiles, Google Fonts, Leaflet CDN) ---
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // let API/CDN requests go straight through

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache newly-visited same-origin pages too, so repeat visits work offline
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => cached);
    })
  );
});
