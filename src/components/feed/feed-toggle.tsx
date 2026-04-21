"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function FeedToggle() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("filter") ?? "all";

  const go = (filter: string) => {
    const p = new URLSearchParams(params.toString());
    if (filter === "all") p.delete("filter");
    else p.set("filter", filter);
    p.delete("take");
    router.push(`/home?${p.toString()}`);
  };

  return (
    <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit">
      {(["all", "following"] as const).map((f) => (
        <button
          key={f}
          onClick={() => go(f)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            current === f
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {f === "all" ? "Todos" : "Seguindo"}
        </button>
      ))}
    </div>
  );
}
