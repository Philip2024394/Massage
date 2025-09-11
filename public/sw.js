// A minimal service worker to make the app installable.
self.addEventListener('fetch', (event) => {
  // This basic fetch handler is sufficient for PWA installation.
  // For offline capabilities, more complex caching strategies would be needed.
  event.respondWith(fetch(event.request));
});
