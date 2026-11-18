const VIDEO_CACHE = "christmas-tree-video-v2";
const SHELL_CACHE = "christmas-tree-shell-v1";
const KEEP = [VIDEO_CACHE, SHELL_CACHE];
const VIDEO_PATH = "/assets/Video/";
const STATIC_PATH = "/_next/static/";
const NAVIGATION_TIMEOUT_MS = 3000;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !KEEP.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const request = e.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith(VIDEO_PATH)) {
    e.respondWith(serveVideo(request));
  } else if (url.pathname.startsWith(STATIC_PATH)) {
    e.respondWith(serveStatic(request));
  } else if (request.mode === "navigate" && url.pathname === "/") {
    e.respondWith(servePage(request));
  }
});

async function serveStatic(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request.url, { ignoreSearch: true });
  return cached || fetch(request);
}

async function servePage(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match("/");
  const network = fetch(request)
    .then(res => {
      if (cached && res.ok) cache.put("/", res.clone());
      return res;
    })
    .catch(() => null);
  if (!cached) return (await network) || Response.error();

  const timeout = new Promise(resolve => setTimeout(() => resolve(null), NAVIGATION_TIMEOUT_MS));
  return (await Promise.race([network, timeout])) || cached;
}

async function serveVideo(request) {
  const cache = await caches.open(VIDEO_CACHE);
  const cached = await cache.match(request.url);
  if (!cached) return fetch(request);

  const range = request.headers.get("range");
  if (!range) return cached;

  const blob = await cached.blob();
  const size = blob.size;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return cached;

  let start, end;
  if (m[1] === "" && m[2] !== "") {
    start = Math.max(size - Number(m[2]), 0);
    end = size - 1;
  } else {
    start = Number(m[1] || 0);
    end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  }

  if (start >= size || start > end) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${size}` },
    });
  }

  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": cached.headers.get("Content-Type") || "video/mp4",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}
