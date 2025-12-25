const CACHE_NAME = "christmas-tree-offline-v1";

const ASSETS = [
  "/",
  "/index.html",

  "/assets/Video/ipad-boc tham-01_2.mp4",
  "/assets/Video/FreeMax.mp4",
  "/assets/Video/FreeAir.mp4",
  "/assets/Video/GloryAir.mp4",
  "/assets/Video/TravelGo.mp4",
  "/assets/Video/Comfy.mp4",
  "/assets/Video/Lumbar.mp4",
  "/assets/Video/Voucher.mp4",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
