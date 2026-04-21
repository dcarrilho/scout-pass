"use client";

import { useActionState, useState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPw, setShowPw] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-[18px]">
      {state?.message && (
        <p className="text-sm text-red-400 -mb-1">{state.message}</p>
      )}

      {/* Email */}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-[13px] font-medium text-white/85">
          E-mail
        </label>
        <div
          className="rounded-[10px] border transition-all duration-150 focus-within:border-orange-500"
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.02)",
          }}
          onFocus={() => {}}
        >
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="piloto@scoutpass.com"
            required
            className="w-full h-[46px] px-[14px] bg-transparent outline-none text-[15px] text-white placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-[13px] font-medium text-white/85">
          Senha
        </label>
        <div
          className="rounded-[10px] border transition-all duration-150 focus-within:border-orange-500 flex items-center relative"
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="flex-1 h-[46px] pl-[14px] pr-12 bg-transparent outline-none text-[15px] text-white placeholder:text-white/30"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-1.5 top-1.5 w-9 h-9 rounded-lg flex items-center justify-center text-white/55 hover:text-white transition-colors"
          >
            {showPw ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-12 rounded-[10px] text-[15px] font-semibold tracking-tight flex items-center justify-center gap-2.5 transition-all duration-150 disabled:opacity-85 disabled:cursor-default"
        style={{
          background: "#f97316",
          color: "#0c0a09",
          boxShadow: "0 8px 24px rgba(249,115,22,0.3)",
        }}
      >
        {pending ? (
          <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black/80 animate-spin" />
        ) : (
          "Entrar"
        )}
      </button>
    </form>
  );
}
