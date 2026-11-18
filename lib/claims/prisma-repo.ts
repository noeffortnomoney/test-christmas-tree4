import { Prisma, type GiftClaim } from "@prisma/client";
import { prisma } from "../prisma";
import { dateRange } from "./filter";
import type { ClaimFilter, ClaimRecord, ClaimRepo, ClaimStats } from "./types";

function toWhere(filter: ClaimFilter): Prisma.GiftClaimWhereInput {
  const { gte, lte } = dateRange(filter);
  return {
    giftId: filter.giftId,
    device: filter.device,
    claimedAt: gte || lte ? { gte, lte } : undefined,
  };
}

function toRecord(row: GiftClaim): ClaimRecord {
  return {
    id: row.id,
    giftId: row.giftId,
    giftName: row.giftName,
    device: row.device,
    userAgent: row.userAgent,
    claimedAt: row.claimedAt.toISOString(),
    telegramSent: row.telegramSent,
  };
}

export const prismaRepo: ClaimRepo = {
  async insert(record) {
    try {
      await prisma.giftClaim.create({
        data: { ...record, claimedAt: new Date(record.claimedAt) },
      });
      return true;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return false;
      throw err;
    }
  },

  async markTelegramSent(id) {
    await prisma.giftClaim.update({ where: { id }, data: { telegramSent: true } });
  },

  async list(filter, page, pageSize) {
    const where = toWhere(filter);
    const [rows, total] = await Promise.all([
      prisma.giftClaim.findMany({
        where,
        orderBy: { claimedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.giftClaim.count({ where }),
    ]);
    return { rows: rows.map(toRecord), total };
  },

  async listAll(filter, limit) {
    const rows = await prisma.giftClaim.findMany({
      where: toWhere(filter),
      orderBy: { claimedAt: "desc" },
      take: limit,
    });
    return rows.map(toRecord);
  },

  async stats(filter) {
    const where = toWhere(filter);
    const [byGift, byDevice] = await Promise.all([
      prisma.giftClaim.groupBy({ by: ["giftId"], where, _count: { _all: true } }),
      prisma.giftClaim.groupBy({ by: ["device"], where, _count: { _all: true } }),
    ]);
    const stats: ClaimStats = { total: 0, byGift: {}, byDevice: {} };
    for (const g of byGift) {
      stats.byGift[g.giftId] = g._count._all;
      stats.total += g._count._all;
    }
    for (const d of byDevice) stats.byDevice[d.device] = d._count._all;
    return stats;
  },

  async devices() {
    const rows = await prisma.giftClaim.findMany({
      distinct: ["device"],
      select: { device: true },
      orderBy: { device: "asc" },
    });
    return rows.map((r) => r.device);
  },
};
