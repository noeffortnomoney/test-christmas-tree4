import { formatDateTimeVN } from "../format";
import { GIFT_BY_ID } from "../gifts";
import type { ClaimRecord } from "./types";

function cell(value: string | number): string {
  const s = String(value);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function neutralize(text: string): string {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

export function claimsToCsv(rows: readonly ClaimRecord[]): string {
  const header = ["STT", "Thời gian", "Quà", "Tên quà đầy đủ", "Thiết bị", "Đã báo Telegram"];
  const lines = rows.map((r, i) =>
    [
      i + 1,
      formatDateTimeVN(r.claimedAt),
      GIFT_BY_ID.get(r.giftId)?.shortName ?? r.giftId,
      r.giftName,
      neutralize(r.device),
      r.telegramSent ? "Có" : "Không",
    ]
      .map(cell)
      .join(","),
  );
  return "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
}
