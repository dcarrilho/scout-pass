import React from "react";

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
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/75">{label}</label>
      {children}
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
