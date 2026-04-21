"use client";

import React, { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

export const inputCls =
  "w-full rounded-xl px-4 py-3 text-sm text-white/90 outline-none transition-colors placeholder:text-white/30";

export const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
};

export const inputFocusStyle = {
  outline: "none",
  borderColor: "rgba(249,115,22,0.5)",
};

export function DarkField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/75">{label}</label>
      {children}
      {hint && !error && <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={inputCls + " " + (props.className ?? "")}
      style={{ ...inputStyle, ...props.style }}
      onFocus={(e) => {
        (e.target as HTMLInputElement).style.borderColor = "rgba(249,115,22,0.5)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)";
        props.onBlur?.(e);
      }}
    />
  );
}

export function DarkTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={inputCls + " resize-none " + (props.className ?? "")}
      style={{ ...inputStyle, ...props.style }}
      onFocus={(e) => {
        e.target.style.borderColor = "rgba(249,115,22,0.5)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "rgba(255,255,255,0.1)";
        props.onBlur?.(e);
      }}
    />
  );
}

export function DarkSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={inputCls + " " + (props.className ?? "")}
      style={{ ...inputStyle, ...props.style }}
      onFocus={(e) => {
        e.target.style.borderColor = "rgba(249,115,22,0.5)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "rgba(255,255,255,0.1)";
        props.onBlur?.(e);
      }}
    />
  );
}

export function DarkSubmit({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity disabled:opacity-60"
      style={{ background: "#f97316", color: "#0c0a09" }}
    >
      {pending ? (pendingLabel ?? "Salvando...") : label}
    </button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-red-400">{message}</p>;
}

export function DarkCoverPicker({ currentUrl }: { currentUrl?: string | null }) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const display = preview ?? currentUrl;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/75">Imagem de capa <span style={{ color: "rgba(255,255,255,0.3)" }}>(opcional)</span></label>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="relative w-full h-28 rounded-xl overflow-hidden group"
        style={{ border: "1px dashed rgba(255,255,255,0.2)" }}
      >
        {display ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={display} alt="Capa" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: "repeating-linear-gradient(135deg, #1a1614 0 10px, #141210 10px 20px)" }}>
            <ImagePlus className="size-6 text-white/30" />
            <span className="text-xs text-white/40">Toque para adicionar capa</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(0,0,0,0.5)" }}>
          <ImagePlus className="size-5 text-white" />
          <span className="text-sm text-white font-medium">{display ? "Alterar capa" : "Adicionar capa"}</span>
        </div>
      </button>
      <input
        ref={ref}
        name="cover"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }}
      />
      {preview && <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Nova capa selecionada ✓</p>}
    </div>
  );
}
