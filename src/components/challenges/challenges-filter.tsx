"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Status = "all" | "progress" | "complete";

const FILTERS: { key: Status; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "progress", label: "Em progresso" },
  { key: "complete", label: "Completos" },
];

export function ChallengesFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = (params.get("status") ?? "all") as Status;

  const go = (key: Status) => {
    const p = new URLSearchParams(params.toString());
    if (key === "all") p.delete("status");
    else p.set("status", key);
    router.push(`/desafios?${p.toString()}`);
  };

  return (
    <div className="flex gap-2 px-4 overflow-x-auto scrollbar-none pb-1">
      {FILTERS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => go(key)}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0"
          style={
            current === key
              ? { background: "#f97316", color: "#0c0a09" }
              : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
