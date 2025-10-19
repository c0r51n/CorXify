const CACHE_NAME = "cor-xify-cache-v2"; // ++Version bei jedem Deployment
const urlsToCache = [
  "/", 
  "/index.html", 
  "/manifest.json"
];

// Install: Cache Grunddateien
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // sofort aktivieren
});

// Activate: alten Cache löschen
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim(); // sofort Kontrolle übernehmen
});

// Fetch: zuerst aus Cache, sonst aus Netzwerk
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(networkResponse => {
        // optional: neue Assets in Cache speichern
        if (event.request.method === "GET" && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
