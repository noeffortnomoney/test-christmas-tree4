export const VIDEO_CACHE = "christmas-tree-video-v2";
export const SHELL_CACHE = "christmas-tree-shell-v1";

export type PrepareProgress = {
  done: number;
  total: number;
  fraction: number;
};

export type PrepareResult = "ready" | "unsupported";

function shellUrls(): string[] {
  const statics = performance
    .getEntriesByType("resource")
    .map((e) => e.name)
    .filter((name) => name.startsWith(`${location.origin}/_next/static/`))
    .map((name) => new URL(name).pathname);
  return ["/", ...new Set(statics)];
}

async function cacheShell(): Promise<void> {
  const cache = await caches.open(SHELL_CACHE);
  const wanted = shellUrls();
  await Promise.all(
    wanted.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "no-cache" });
        if (res.ok) await cache.put(url, res);
      } catch {}
    }),
  );
  const keep = new Set(wanted.map((u) => new URL(u, location.origin).href));
  for (const req of await cache.keys()) {
    if (!keep.has(req.url)) await cache.delete(req);
  }
}

async function downloadToCache(
  cache: Cache,
  url: string,
  onFraction: (fraction: number) => void,
): Promise<void> {
  const res = await fetch(url);
  if (res.status !== 200 || !res.body) throw new Error(`HTTP ${res.status}`);

  const total = Number(res.headers.get("Content-Length")) || 0;
  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    if (total) onFraction(Math.min(loaded / total, 1));
  }

  const type = res.headers.get("Content-Type") || "video/mp4";
  const blob = new Blob(chunks, { type });
  if (total && blob.size !== total) throw new Error("Tải video bị thiếu");
  await cache.put(
    url,
    new Response(blob, { headers: { "Content-Type": type, "Content-Length": String(blob.size) } }),
  );
}

function waitForController(timeoutMs: number): Promise<void> {
  if (navigator.serviceWorker.controller) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", done);
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    navigator.serviceWorker.addEventListener("controllerchange", done);
  });
}

export async function prepareOffline(
  videoUrls: readonly string[],
  onProgress: (p: PrepareProgress) => void,
  isCancelled: () => boolean,
): Promise<PrepareResult> {
  if (!("serviceWorker" in navigator) || !("caches" in window)) return "unsupported";

  await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  navigator.storage?.persist?.().catch(() => {});

  if (process.env.NODE_ENV === "production") await cacheShell();

  const cache = await caches.open(VIDEO_CACHE);
  const total = videoUrls.length;
  let done = 0;
  for (const url of videoUrls) {
    if (isCancelled()) return "ready";
    if (!(await cache.match(url))) {
      await downloadToCache(cache, url, (fraction) => onProgress({ done, total, fraction }));
    }
    done++;
    onProgress({ done, total, fraction: 0 });
  }

  await waitForController(5000);
  return "ready";
}
