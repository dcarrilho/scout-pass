"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
          className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
        />
      )}

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum waypoint encontrado.</p>
      )}

      {/* Awaiting approval */}
      {awaiting.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Aguardando aprovação · {awaiting.length}
          </p>
          {awaiting.map((t) => (
            <div key={t.id} className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 px-4 py-3 flex items-center gap-3">
              <span className="shrink-0">⏳</span>
              <span className="text-sm flex-1">{t.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* To visit */}
      {toVisit.length > 0 && (
        <div className="space-y-2">
          {(awaiting.length > 0 || visited.length > 0) && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              A visitar · {toVisit.length}
            </p>
          )}
          {toVisit.map((t) => (
            <div key={t.id} className="rounded-xl border bg-card px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0">⭕</span>
                <span className="text-sm truncate">{t.name}</span>
              </div>
              <Link
                href={`/desafios/${challengeId}/checkin/${t.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
              >
                Check-in
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Visited (collapsible) */}
      {visited.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowVisited((v) => !v)}
            className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground uppercase tracking-wide"
          >
            <span>Visitados · {visited.length}</span>
            <span className="text-base leading-none">{showVisited ? "▲" : "▼"}</span>
          </button>
          {showVisited && visited.map((t) => (
            <div key={t.id} className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10 px-4 py-3 flex items-center gap-3">
              <span className="shrink-0">✅</span>
              <span className="text-sm text-muted-foreground line-through truncate">{t.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
