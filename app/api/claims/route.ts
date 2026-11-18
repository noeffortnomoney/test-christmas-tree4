import { after, NextResponse, type NextRequest } from "next/server";
import { isDashboardAuthed } from "@/lib/auth";
import { parseFilter } from "@/lib/claims/filter";
import { getClaimRepo } from "@/lib/claims/repo";
import type { ClaimRecord, ClaimsResponse } from "@/lib/claims/types";
import { GIFT_BY_ID } from "@/lib/gifts";
import { sendClaimToTelegram, telegramEnabled } from "@/lib/telegram";
import { UUID_RE } from "@/lib/uid";

const MAX_PAGE_SIZE = 200;
const MAX_CLOCK_SKEW_MS = 7 * 24 * 60 * 60 * 1000;

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function normalizeDevice(value: unknown): string {
  if (typeof value !== "string") return "Không rõ";
  const cleaned = value.replace(/[^\p{L}\p{N} _.\-]/gu, "").trim().slice(0, 40);
  return cleaned || "Không rõ";
}

function safeClaimedAt(value: unknown, now: Date): Date {
  if (typeof value !== "string") return now;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return now;
  if (d > now || now.getTime() - d.getTime() > MAX_CLOCK_SKEW_MS) return now;
  return d;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Dữ liệu không phải JSON");
  }

  const { id, giftId } = body;
  if (typeof id !== "string" || !UUID_RE.test(id)) return bad("id không hợp lệ");
  const gift = typeof giftId === "number" ? GIFT_BY_ID.get(giftId) : undefined;
  if (!gift) return bad("Quà không hợp lệ");

  const record: ClaimRecord = {
    id,
    giftId: gift.id,
    giftName: gift.name,
    device: normalizeDevice(body.device),
    userAgent: (req.headers.get("user-agent") ?? "").slice(0, 300),
    claimedAt: safeClaimedAt(body.claimedAt, new Date()).toISOString(),
    telegramSent: false,
  };

  let created: boolean;
  try {
    const repo = await getClaimRepo();
    created = await repo.insert(record);
    if (created && telegramEnabled()) {
      after(async () => {
        try {
          if (await sendClaimToTelegram(record)) await repo.markTelegramSent(record.id);
        } catch (err) {
          console.error("[telegram]", err);
        }
      });
    }
  } catch (err) {
    console.error("[POST /api/claims]", err);
    return NextResponse.json({ error: "Không lưu được lượt trúng quà" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: created ? 201 : 200 });
}

export async function GET(req: NextRequest) {
  if (!(await isDashboardAuthed())) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const filter = parseFilter(sp);
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(sp.get("pageSize") ?? "50", 10) || 50));

  try {
    const repo = await getClaimRepo();
    const [pageData, stats, devices] = await Promise.all([
      repo.list(filter, page, pageSize),
      repo.stats(filter),
      repo.devices(),
    ]);
    const res: ClaimsResponse = { ...pageData, page, pageSize, stats, devices };
    return NextResponse.json(res, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[GET /api/claims]", err);
    return NextResponse.json({ error: "Không đọc được dữ liệu" }, { status: 500 });
  }
}
