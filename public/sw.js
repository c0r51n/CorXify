self.addEventListener("install", () => {
  console.log("Service Worker installiert");
});
self.addEventListener("fetch", () => {
  // Hier könntest du später Caching einbauen
});
