"use client";

import { useState, useMemo, useTransition } from "react";
import { linkTargetToChallenge } from "@/app/actions/targets";
import { Search } from "lucide-react";

type Available = { id: string; name: string; type: string; challenges: { name: string }[] };

type Props = { challengeId: string; available: Available[] };

export function AddExistingWaypointForm({ challengeId, available }: Props) {
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [linkedId, setLinkedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? available.filter((t) => t.name.toLowerCase().includes(q)) : available;
  }, [available, search]);

  function handleLink(targetId: string) {
    startTransition(async () => {
      setLinkedId(targetId);
      const action = linkTargetToChallenge.bind(null, targetId, challengeId);
      await action(undefined, new FormData());
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
        <input
          type="search"
          placeholder={`Buscar entre ${available.length} waypoints disponíveis…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/30"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(249,115,22,0.5)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-white/40 text-center py-8">Nenhum waypoint encontrado.</p>
      )}

      <div className="space-y-2">
        {filtered.slice(0, 100).map((t) => (
          <div
            key={t.id}
            className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="min-w-0">
              <p className="text-sm text-white/80 truncate">{t.name}</p>
              {t.challenges[0] && (
                <p className="text-[11px] text-white/35 mt-0.5 truncate">
                  Usado em: {t.challenges[0].name}
                </p>
              )}
            </div>
            <button
              type="button"
              disabled={pending && linkedId === t.id}
              onClick={() => handleLink(t.id)}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
              style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}
            >
              {pending && linkedId === t.id ? "…" : "Adicionar"}
            </button>
          </div>
        ))}
      </div>
      {filtered.length > 100 && (
        <p className="text-xs text-white/30 text-center">Mostrando 100 de {filtered.length}. Refine a busca.</p>
      )}
    </div>
  );
}
