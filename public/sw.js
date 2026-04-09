const CACHE_NAME = "gandhi-images-v1";

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i;

// On activate, clear old cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only cache GET requests for images
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isImage =
    IMAGE_EXTENSIONS.test(url.pathname) ||
    url.searchParams.has("w") ||       // Cloudinary/imgproxy style
    url.searchParams.has("fit");       // Cloudinary/imgproxy style

  if (!isImage) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        // Only cache valid responses
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        // Network failed and nothing in cache — return nothing (browser shows broken img)
        return new Response(null, { status: 503 });
      }
    })
  );
});
