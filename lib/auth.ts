import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "xmas_dashboard";
export const SESSION_MAX_AGE_S = 60 * 60 * 12;

export function sessionToken(): string | null {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(`xmas-tree-dashboard:${password}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPassword(input: string): boolean {
  const password = process.env.DASHBOARD_PASSWORD;
  return !!password && safeEqual(input, password);
}

export async function isDashboardAuthed(): Promise<boolean> {
  const expected = sessionToken();
  const actual = (await cookies()).get(SESSION_COOKIE)?.value;
  return !!expected && !!actual && safeEqual(actual, expected);
}
