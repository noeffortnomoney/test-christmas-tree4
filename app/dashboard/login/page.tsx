import { redirect } from "next/navigation";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { isDashboardAuthed } from "@/lib/auth";

export default async function LoginPage() {
  if (await isDashboardAuthed()) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-4xl" aria-hidden>🎄</div>
          <h1 className="text-2xl font-extrabold text-emerald-900">Dashboard trúng quà</h1>
          <p className="text-sm text-slate-500">Nhập mật khẩu để xem các lượt bốc thăm</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
