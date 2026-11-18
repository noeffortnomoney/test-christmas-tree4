"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { logout } from "@/app/dashboard/actions";
import type { ClaimsResponse } from "@/lib/claims/types";
import { formatDateTimeVN, formatTimeVN } from "@/lib/format";
import { GIFT_BY_ID, GIFTS } from "@/lib/gifts";

const PAGE_SIZE = 50;
const REFRESH_MS = 15_000;

type Filters = { from: string; to: string; gift: string; device: string };
const EMPTY: Filters = { from: "", to: "", gift: "", device: "" };

function toParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v) p.set(k, v);
  return p;
}

function todayVN(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

const fieldCls =
  "h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600";

type Props = { storageMode: "database" | "file"; telegramOn: boolean };

export function DashboardClient({ storageMode, telegramOn }: Props) {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ClaimsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const router = useRouter();

  const query = useMemo(() => toParams(filters).toString(), [filters]);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams(query);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    fetch(`/api/claims?${params}`, { signal: ctrl.signal, cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/dashboard/login");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData((await res.json()) as ClaimsResponse);
        setError(null);
        setUpdatedAt(new Date());
      })
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setError("Không tải được dữ liệu — sẽ tự thử lại.");
      });
    return () => ctrl.abort();
  }, [query, page, tick, router]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const hasFilter = Object.values(filters).some(Boolean);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-900">🎄 Dashboard trúng quà</h1>
          <p className="text-sm text-slate-500">
            {updatedAt ? `Cập nhật lúc ${formatTimeVN(updatedAt)} · tự làm mới mỗi 15 giây` : "Đang tải…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/claims/export?${query}`}
            className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-bold leading-10 text-white hover:bg-emerald-800"
          >
            Xuất CSV
          </a>
          <form action={logout}>
            <button className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Đăng xuất
            </button>
          </form>
        </div>
      </header>

      {(storageMode === "file" || !telegramOn) && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {storageMode === "file" && <p>Đang chạy thử: dữ liệu lưu vào file .data/claims.json (chưa có DATABASE_URL).</p>}
          {!telegramOn && <p>Telegram đang tắt: không gửi tin vào nhóm (chạy local hoặc thiếu TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).</p>}
        </div>
      )}

      <section className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Từ ngày
          <input type="date" className={fieldCls} value={filters.from} onChange={(e) => setFilter("from", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Đến ngày
          <input type="date" className={fieldCls} value={filters.to} onChange={(e) => setFilter("to", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Quà
          <select className={fieldCls} value={filters.gift} onChange={(e) => setFilter("gift", e.target.value)}>
            <option value="">Tất cả</option>
            {GIFTS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.shortName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          Thiết bị
          <select className={fieldCls} value={filters.device} onChange={(e) => setFilter("device", e.target.value)}>
            <option value="">Tất cả</option>
            {data?.devices.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <button
          className="h-10 rounded-lg border border-emerald-600 px-4 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
          onClick={() => {
            const today = todayVN();
            setFilters((f) => ({ ...f, from: today, to: today }));
            setPage(1);
          }}
        >
          Hôm nay
        </button>
        {hasFilter && (
          <button
            className="h-10 rounded-lg px-3 text-sm font-bold text-slate-500 hover:text-slate-800"
            onClick={() => {
              setFilters(EMPTY);
              setPage(1);
            }}
          >
            Xóa lọc
          </button>
        )}
      </section>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 rounded-xl bg-emerald-800 p-4 text-white sm:col-span-4">
          <div className="text-sm font-semibold opacity-80">Tổng lượt trúng quà</div>
          <div className="text-4xl font-extrabold tabular-nums">{data?.stats.total ?? "–"}</div>
        </div>
        {GIFTS.map((g) => (
          <button
            key={g.id}
            onClick={() => setFilter("gift", filters.gift === String(g.id) ? "" : String(g.id))}
            className={`rounded-xl border p-4 text-left transition ${
              filters.gift === String(g.id)
                ? "border-emerald-600 bg-emerald-50"
                : "border-slate-200 bg-white hover:border-emerald-300"
            }`}
          >
            <div className="text-sm font-semibold text-slate-600">{g.shortName}</div>
            <div className="text-2xl font-extrabold tabular-nums text-slate-900">{data?.stats.byGift[g.id] ?? 0}</div>
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Quà</th>
                <th className="px-4 py-3">Thiết bị</th>
                <th className="px-4 py-3">Telegram</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.rows.map((r, i) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 tabular-nums text-slate-400">{data.total - (page - 1) * PAGE_SIZE - i}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatDateTimeVN(r.claimedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{GIFT_BY_ID.get(r.giftId)?.shortName ?? r.giftId}</div>
                    <div className="text-xs text-slate-500">{r.giftName}</div>
                  </td>
                  <td className="px-4 py-3">{r.device}</td>
                  <td className="px-4 py-3">
                    {r.telegramSent ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">Đã gửi</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">Chưa gửi</span>
                    )}
                  </td>
                </tr>
              ))}
              {data && data.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    Chưa có lượt trúng quà nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
            <span className="text-slate-500">
              Trang {page}/{totalPages} · {data.total} lượt
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-9 rounded-lg border border-slate-300 px-3 font-bold disabled:opacity-40"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-9 rounded-lg border border-slate-300 px-3 font-bold disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
