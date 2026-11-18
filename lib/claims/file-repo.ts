import { promises as fs } from "node:fs";
import path from "node:path";
import { computeStats, matchesFilter } from "./filter";
import type { ClaimRecord, ClaimRepo } from "./types";

const FILE = path.join(process.cwd(), ".data", "claims.json");

let writeChain: Promise<unknown> = Promise.resolve();

async function readAll(): Promise<ClaimRecord[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as ClaimRecord[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(all: ClaimRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(all, null, 2), "utf8");
}

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const next = writeChain.then(task, task);
  writeChain = next.catch(() => {});
  return next;
}

function newestFirst(a: ClaimRecord, b: ClaimRecord): number {
  return b.claimedAt.localeCompare(a.claimedAt);
}

export const fileRepo: ClaimRepo = {
  insert(record) {
    return serialize(async () => {
      const all = await readAll();
      if (all.some((r) => r.id === record.id)) return false;
      all.push(record);
      await writeAll(all);
      return true;
    });
  },

  markTelegramSent(id) {
    return serialize(async () => {
      const all = await readAll();
      const row = all.find((r) => r.id === id);
      if (!row) return;
      row.telegramSent = true;
      await writeAll(all);
    });
  },

  async list(filter, page, pageSize) {
    const rows = (await readAll()).filter((r) => matchesFilter(r, filter)).sort(newestFirst);
    return { rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length };
  },

  async listAll(filter, limit) {
    return (await readAll()).filter((r) => matchesFilter(r, filter)).sort(newestFirst).slice(0, limit);
  },

  async stats(filter) {
    return computeStats((await readAll()).filter((r) => matchesFilter(r, filter)));
  },

  async devices() {
    return [...new Set((await readAll()).map((r) => r.device))].sort();
  },
};
