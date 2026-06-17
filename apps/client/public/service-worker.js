/**
 * Rhizoh PWA App Shell — static shell cache only.
 * N12 policy: never cache API, gateway, LLM, or user/ghost payloads.
 * Hashed /assets/ and /cesium/ are cached on demand after first load.
 */
const SHELL_VERSION = "rhizoh-shell-v3";
const CACHE_NAME = `rhizoh-app-shell-${SHELL_VERSION}`;

const PRECACHE_URLS = ["/", "/index.html", "/manifest.webmanifest", "/favicon.svg"];

const NEVER_CACHE_PATH_RE = [
  /^\/api\//,
  /^\/rhizoh\//,
  /gateway/i,
  /cohort/i,
  /llm/i
];

/**
 * @param {URL} url
 */
function shouldBypassCache(url) {
  if (url.origin !== self.location.origin) return true;
  const path = url.pathname || "";
  if (path.startsWith("/chess-engine/")) return true;
  return NEVER_CACHE_PATH_RE.some((re) => re.test(path));
}

/**
 * @param {Request} request
 */
function isNavigationRequest(request) {
  if (request.mode === "navigate") return true;
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("rhizoh-app-shell-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (shouldBypassCache(url)) return;

  if (url.pathname.startsWith("/chess-engine/")) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).catch(() => caches.match(event.request))
    );
    return;
  }

  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/cesium/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/index.html") || caches.match("/"))
    );
    return;
  }

  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
