// Pravaha's service worker, deliberately tiny: it makes the app installable and gives a friendly page when a
// navigation fails because the device is offline. It caches ONE page (/offline) and nothing else: no scripts,
// no API responses, no video, so a deploy can never leave anyone on stale code.
const CACHE = "pravaha-offline-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return; // everything else goes straight to the network
  event.respondWith(
    fetch(event.request).catch(async () => (await caches.match(OFFLINE_URL)) ?? Response.error()),
  );
});
