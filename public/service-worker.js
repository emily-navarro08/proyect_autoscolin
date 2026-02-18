const CACHE_NAME = "app-AutosColín-v1";

const ASSETS = [
  "/",
  "/index.html",
  "/css/styles_index.css",
  "/js/app.js",
  "/manifest.json",
  "/img/icon-192.png",
  "/img/icon-512.png"
];

// instalar service worker
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// servir desde cache
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
