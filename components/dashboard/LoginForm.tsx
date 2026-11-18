"use client";

import { useActionState } from "react";
import { type LoginState, login } from "@/app/dashboard/actions";

const initial: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <form action={action} className="mt-6 flex flex-col gap-3">
      <label htmlFor="password" className="text-sm font-bold text-slate-700">
        Mật khẩu
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="h-12 rounded-xl border-2 border-slate-200 px-4 text-base outline-none focus:border-emerald-600"
      />
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-12 rounded-xl bg-emerald-700 text-lg font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Đang kiểm tra…" : "Đăng nhập"}
      </button>
    </form>
  );
}
