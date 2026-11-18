import { GIFT_BY_ID } from "../gifts";
import type { ClaimFilter, ClaimRecord, ClaimStats } from "./types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VN_OFFSET = "+07:00";

export function parseFilter(sp: URLSearchParams): ClaimFilter {
  const filter: ClaimFilter = {};
  const from = sp.get("from");
  if (from && DATE_RE.test(from)) filter.from = from;
  const to = sp.get("to");
  if (to && DATE_RE.test(to)) filter.to = to;
  const gift = Number(sp.get("gift"));
  if (GIFT_BY_ID.has(gift)) filter.giftId = gift;
  const device = sp.get("device")?.trim().slice(0, 40);
  if (device) filter.device = device;
  return filter;
}

export function dateRange(filter: ClaimFilter): { gte?: Date; lte?: Date } {
  return {
    gte: filter.from ? new Date(`${filter.from}T00:00:00.000${VN_OFFSET}`) : undefined,
    lte: filter.to ? new Date(`${filter.to}T23:59:59.999${VN_OFFSET}`) : undefined,
  };
}

export function matchesFilter(record: ClaimRecord, filter: ClaimFilter): boolean {
  if (filter.giftId && record.giftId !== filter.giftId) return false;
  if (filter.device && record.device !== filter.device) return false;
  const { gte, lte } = dateRange(filter);
  const claimed = new Date(record.claimedAt).getTime();
  if (gte && claimed < gte.getTime()) return false;
  if (lte && claimed > lte.getTime()) return false;
  return true;
}

export function computeStats(records: readonly ClaimRecord[]): ClaimStats {
  const stats: ClaimStats = { total: 0, byGift: {}, byDevice: {} };
  for (const r of records) {
    stats.total++;
    stats.byGift[r.giftId] = (stats.byGift[r.giftId] ?? 0) + 1;
    stats.byDevice[r.device] = (stats.byDevice[r.device] ?? 0) + 1;
  }
  return stats;
}
