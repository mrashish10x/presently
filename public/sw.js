// Minimal service worker: makes the app installable.
// It deliberately does NOT cache pages or API responses, so users never see
// stale data or another user's data.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(
            "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'><body style='font-family:sans-serif;text-align:center;padding:3rem'><h2>You are offline</h2><p>Please check your internet connection and try again.</p>",
            { headers: { "Content-Type": "text/html" } }
          )
      )
    );
  }
});
