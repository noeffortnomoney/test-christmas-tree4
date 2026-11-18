import { NextResponse, type NextRequest } from "next/server";
import { isDashboardAuthed } from "@/lib/auth";
import { claimsToCsv } from "@/lib/claims/csv";
import { parseFilter } from "@/lib/claims/filter";
import { getClaimRepo } from "@/lib/claims/repo";

const EXPORT_LIMIT = 20000;

export async function GET(req: NextRequest) {
  if (!(await isDashboardAuthed())) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const rows = await (await getClaimRepo()).listAll(parseFilter(req.nextUrl.searchParams), EXPORT_LIMIT);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(claimsToCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="trung-qua-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/claims/export]", err);
    return NextResponse.json({ error: "Không xuất được dữ liệu" }, { status: 500 });
  }
}
