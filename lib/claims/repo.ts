import type { ClaimRepo } from "./types";

export async function getClaimRepo(): Promise<ClaimRepo> {
  if (process.env.DATABASE_URL) return (await import("./prisma-repo")).prismaRepo;
  if (process.env.VERCEL) throw new Error("Thiếu DATABASE_URL trên Vercel (Project → Settings → Environment Variables)");
  return (await import("./file-repo")).fileRepo;
}
