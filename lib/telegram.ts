import type { ClaimRecord } from "./claims/types";
import { formatDateTimeVN } from "./format";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function telegramEnabled(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    !!process.env.TELEGRAM_BOT_TOKEN &&
    !!process.env.TELEGRAM_CHAT_ID
  );
}

export async function sendClaimToTelegram(claim: ClaimRecord): Promise<boolean> {
  if (!telegramEnabled()) return false;

  const text = [
    "🎁 <b>Có khách trúng quà!</b>",
    `Quà: <b>${escapeHtml(claim.giftName)}</b>`,
    `Thiết bị: ${escapeHtml(claim.device)}`,
    `Thời gian: ${formatDateTimeVN(claim.claimedAt)}`,
  ].join("\n");

  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    console.error("[telegram]", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}
