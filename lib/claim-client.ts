import { uuidV4 } from "./uid";

type PendingClaim = {
  id: string;
  giftId: number;
  device: string;
  claimedAt: string;
};

const QUEUE_KEY = "xmas-tree-pending-claims";
const DEVICE_KEY = "xmas-tree-device";
const SEND_DELAY_MS = 1500;
const RETRY_MS = 30000;

let memoryQueue: PendingClaim[] = [];
let flushing = false;

function loadQueue(): PendingClaim[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingClaim[]) : [];
  } catch {
    return memoryQueue;
  }
}

function saveQueue(queue: PendingClaim[]): void {
  memoryQueue = queue;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export function getDevice(): string {
  const fromUrl = new URLSearchParams(window.location.search).get("device")?.trim();
  try {
    if (fromUrl) {
      localStorage.setItem(DEVICE_KEY, fromUrl);
      return fromUrl;
    }
    return localStorage.getItem(DEVICE_KEY) || "Không rõ";
  } catch {
    return fromUrl || "Không rõ";
  }
}

export async function flushClaims(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    for (;;) {
      const next = loadQueue()[0];
      if (!next) break;
      let res: Response;
      try {
        res = await fetch("/api/claims", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
          keepalive: true,
        });
      } catch {
        break;
      }
      if (res.status >= 500 || res.status === 429) break;
      saveQueue(loadQueue().filter((c) => c.id !== next.id));
    }
  } finally {
    flushing = false;
  }
}

export function recordClaim(giftId: number): void {
  saveQueue([
    ...loadQueue(),
    { id: uuidV4(), giftId, device: getDevice(), claimedAt: new Date().toISOString() },
  ]);
  setTimeout(flushClaims, SEND_DELAY_MS);
}

export function startClaimSync(): () => void {
  const onOnline = () => void flushClaims();
  const timer = setInterval(onOnline, RETRY_MS);
  window.addEventListener("online", onOnline);
  void flushClaims();
  return () => {
    clearInterval(timer);
    window.removeEventListener("online", onOnline);
  };
}
