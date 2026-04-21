"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Target = { id: string; name: string };

type Props = {
  targets: Target[];
  approvedIds: string[];
  pendingIds: string[];
  challengeId: string;
};

export default function WaypointList({ targets, approvedIds, pendingIds, challengeId }: Props) {
  const [search, setSearch] = useState("");
  const [showVisited, setShowVisited] = useState(false);

  const approvedSet = useMemo(() => new Set(approvedIds), [approvedIds]);
  const pendingSet = useMemo(() => new Set(pendingIds), [pendingIds]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? targets.filter((t) => t.name.toLowerCase().includes(q)) : targets;
  }, [targets, search]);

  const toVisit = filtered.filter((t) => !approvedSet.has(t.id) && !pendingSet.has(t.id));
  const awaiting = filtered.filter((t) => pendingSet.has(t.id));
  const visited = filtered.filter((t) => approvedSet.has(t.id));

  return (
    <div className="space-y-5">
      {targets.length > 8 && (
        <input
          type="search"
          placeholder={`Buscar entre ${targets.length} waypoints…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/30 transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(249,115,22,0.5)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
        />
      )}

      {filtered.length === 0 && (
        <p className="text-sm text-white/40 text-center py-8">Nenhum waypoint encontrado.</p>
      )}

      {/* Aguardando aprovação */}
      {awaiting.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">
            Aguardando aprovação · {awaiting.length}
          </p>
          {awaiting.map((t) => (
            <div
              key={t.id}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.25)" }}
            >
              <span className="shrink-0 text-base">⏳</span>
              <span className="text-sm text-white/80 flex-1">{t.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* A visitar */}
      {toVisit.length > 0 && (
        <div className="space-y-2">
          {(awaiting.length > 0 || visited.length > 0) && (
            <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">
              A visitar · {toVisit.length}
            </p>
          )}
          {toVisit.map((t) => (
            <div
              key={t.id}
              className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0 text-base">⭕</span>
                <span className="text-sm text-white/80 truncate">{t.name}</span>
              </div>
              <Link
                href={`/desafios/${challengeId}/checkin/${t.id}`}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{ background: "#f97316", color: "#0c0a09" }}
              >
                Check-in
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Visitados (colapsável) */}
      {visited.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowVisited((v) => !v)}
            className="flex items-center justify-between w-full text-[11px] font-semibold text-white/35 uppercase tracking-widest hover:text-white/55 transition-colors"
          >
            <span>Visitados · {visited.length}</span>
            <span className="text-base leading-none">{showVisited ? "▲" : "▼"}</span>
          </button>
          {showVisited && visited.map((t) => (
            <div
              key={t.id}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)" }}
            >
              <span className="shrink-0 text-base">✅</span>
              <span className="text-sm text-white/40 line-through truncate">{t.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
