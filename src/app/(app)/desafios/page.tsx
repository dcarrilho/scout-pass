import { Suspense } from "react";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ChallengesFilter } from "@/components/challenges/challenges-filter";

type SearchParams = Promise<{ status?: string }>;

export default async function DesafiosPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await verifySession();
  const { status: statusParam } = await searchParams;
  const statusFilter = (statusParam === "progress" || statusParam === "complete") ? statusParam : "all";

  const [allChallenges, userProgress, organizers, allSeries, userParticipations] = await Promise.all([
    prisma.challenge.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        organizer_id: true,
        series_id: true,
        _count: { select: { targets: true } },
      },
    }),
    prisma.checkIn.groupBy({
      by: ["challenge_id"],
      where: { user_id: session.userId, status: "APPROVED" },
      _count: { _all: true },
    }),
    prisma.organizer.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    }),
    prisma.series.findMany({
      where: { is_active: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
    prisma.challengeParticipant.findMany({
      where: { user_id: session.userId },
      select: { challenge_id: true },
    }),
  ]);

  const participantSet = new Set(userParticipations.map((p) => p.challenge_id));

  const progressMap = Object.fromEntries(userProgress.map((c) => [c.challenge_id, c._count._all]));

  const byOrg: Record<string, typeof allChallenges> = {};
  const bySeries: Record<string, typeof allChallenges> = {};
  const standalone: typeof allChallenges = [];

  for (const c of allChallenges) {
    if (c.series_id) {
      (bySeries[c.series_id] ??= []).push(c);
    } else if (c.organizer_id) {
      (byOrg[c.organizer_id] ??= []).push(c);
    } else {
      standalone.push(c);
    }
  }

  function challengeProgress(challengeId: string, totalTargets: number) {
    const done = progressMap[challengeId] ?? 0;
    const pct = totalTargets > 0 ? Math.round((done / totalTargets) * 100) : 0;
    return { done, pct, isComplete: pct === 100, isStarted: done > 0 };
  }

  function orgStats(orgId: string) {
    const seriesIds = allSeries.filter((s) => s.organizer_id === orgId).map((s) => s.id);
    const challenges = [
      ...(byOrg[orgId] ?? []),
      ...seriesIds.flatMap((sid) => bySeries[sid] ?? []),
    ];
    const total = challenges.reduce((s, c) => s + c._count.targets, 0);
    const done = challenges.reduce((s, c) => s + (progressMap[c.id] ?? 0), 0);
    return {
      count: challenges.length,
      total,
      done,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }

  function matchesFilter(challengeId: string, totalTargets: number) {
    const { isComplete } = challengeProgress(challengeId, totalTargets);
    if (statusFilter === "progress") return participantSet.has(challengeId) && !isComplete;
    if (statusFilter === "complete") return isComplete;
    return true;
  }

  const isFiltered = statusFilter !== "all";
  const filteredChallenges = allChallenges.filter((c) => matchesFilter(c.id, c._count.targets));

  // Build org name lookup for flat filtered view
  const orgNameMap = Object.fromEntries(organizers.map((o) => [o.id, o.name]));
  const seriesNameMap = Object.fromEntries(allSeries.map((s) => [s.id, s.name]));

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="pt-6 space-y-5 pb-8">

        {/* Header */}
        <div className="px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Desafios</h1>
          {(session.role === "MODERATOR" || session.role === "ADMIN") && (
            <div className="flex items-center gap-2">
              <Link
                href="/moderacao"
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                🛡️ Moderação
              </Link>
              <Link
                href="/desafios/nova-organizacao"
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}
              >
                + Organização
              </Link>
            </div>
          )}
        </div>

        {/* Quick-nav chips */}
        {organizers.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
            {organizers.map((org) => {
              const { count, pct } = orgStats(org.id);
              return (
                <Link
                  key={org.id}
                  href={`/desafios/org/${org.slug}`}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 shrink-0 transition-colors hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {org.logo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={org.logo_url} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                  ) : (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ background: "rgba(249,115,22,0.2)", color: "#f97316" }}
                    >
                      {org.name[0]}
                    </span>
                  )}
                  <span className="text-xs font-medium text-white/80 whitespace-nowrap">{org.name}</span>
                  <span className="text-[10px] text-white/35 whitespace-nowrap">{count} · {pct}%</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Filter */}
        <Suspense>
          <ChallengesFilter />
        </Suspense>

        <div className="px-4 space-y-8">

          {/* Empty state */}
          {(isFiltered ? filteredChallenges : allChallenges).length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <span className="text-5xl">🗺️</span>
              <p className="font-semibold text-white">
                {isFiltered ? "Nenhum desafio nessa categoria" : "Nenhum desafio disponível"}
              </p>
              <p className="text-sm text-white/40">
                {isFiltered ? "Tente outro filtro." : "Volte em breve para novidades."}
              </p>
            </div>
          )}

          {/* Filtered flat list */}
          {isFiltered && filteredChallenges.length > 0 && (
            <section className="space-y-3">
              {filteredChallenges.map((challenge) => {
                const total = challenge._count.targets;
                const { done, pct, isComplete, isStarted } = challengeProgress(challenge.id, total);
                const orgName = challenge.organizer_id ? orgNameMap[challenge.organizer_id] : null;
                const seriesName = challenge.series_id ? seriesNameMap[challenge.series_id] : null;
                return (
                  <ChallengeCard
                    key={challenge.id}
                    id={challenge.id}
                    name={challenge.name}
                    done={done}
                    total={total}
                    pct={pct}
                    isComplete={isComplete}
                    isStarted={isStarted}
                    subtitle={seriesName ?? orgName ?? undefined}
                  />
                );
              })}
            </section>
          )}

          {/* Grouped view (all) */}
          {!isFiltered && (
            <>
              {organizers.length > 0 && (
                <section className="space-y-3">
                  <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">Organizadores</p>
                  <div className="grid gap-3">
                    {organizers.map((org) => {
                      const { pct, count, done, total } = orgStats(org.id);
                      return (
                        <Link key={org.id} href={`/desafios/org/${org.slug}`}>
                          <div
                            className="rounded-2xl p-4 space-y-3 transition-all active:scale-[0.99]"
                            style={{ background: "#161412", border: "1px solid rgba(255,255,255,0.06)" }}
                          >
                            <div className="flex items-center gap-3">
                              {org.logo_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={org.logo_url} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                              ) : (
                                <div
                                  className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
                                  style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}
                                >
                                  {org.name[0]}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-white">{org.name}</p>
                                {org.description && (
                                  <p className="text-xs text-white/40 truncate mt-0.5">{org.description}</p>
                                )}
                              </div>
                              <span className="text-[10px] text-white/35 shrink-0">{count} desafios</span>
                            </div>
                            {total > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-white/50">
                                    <span className="text-white font-semibold">{done}</span>
                                    <span> de {total} waypoints</span>
                                  </p>
                                  <span className="text-xs font-semibold" style={{ color: pct === 100 ? "#16a34a" : "#f97316" }}>
                                    {pct}%
                                  </span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${pct}%`, background: pct === 100 ? "#16a34a" : "#f97316" }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {standalone.length > 0 && (
                <section className="space-y-3">
                  {organizers.length > 0 && (
                    <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">Avulsos</p>
                  )}
                  <div className="grid gap-3">
                    {standalone.map((challenge) => {
                      const total = challenge._count.targets;
                      const { done, pct, isComplete, isStarted } = challengeProgress(challenge.id, total);
                      return (
                        <ChallengeCard
                          key={challenge.id}
                          id={challenge.id}
                          name={challenge.name}
                          done={done}
                          total={total}
                          pct={pct}
                          isComplete={isComplete}
                          isStarted={isStarted}
                        />
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

type ChallengeCardProps = {
  id: string;
  name: string;
  done: number;
  total: number;
  pct: number;
  isComplete: boolean;
  isStarted: boolean;
  subtitle?: string;
};

function ChallengeCard({ id, name, done, total, pct, isComplete, isStarted, subtitle }: ChallengeCardProps) {
  const borderColor = isComplete
    ? "rgba(22,163,74,0.35)"
    : isStarted
    ? "rgba(249,115,22,0.3)"
    : "rgba(255,255,255,0.06)";

  const bgColor = isComplete
    ? "rgba(22,163,74,0.06)"
    : isStarted
    ? "rgba(249,115,22,0.05)"
    : "#161412";

  const barColor = isComplete ? "#16a34a" : "#f97316";

  return (
    <Link href={`/desafios/${id}`}>
      <div
        className="rounded-xl p-4 space-y-3 transition-all active:scale-[0.99]"
        style={{ background: bgColor, border: `1px solid ${borderColor}` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white leading-snug">{name}</p>
            {subtitle && <p className="text-[11px] text-white/35 mt-0.5">{subtitle}</p>}
          </div>
          {isComplete ? (
            <span
              className="text-[10px] font-semibold rounded-full px-2.5 py-1 shrink-0 flex items-center gap-1"
              style={{ background: "rgba(22,163,74,0.12)", color: "#16a34a" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] inline-block" />
              Completo
            </span>
          ) : (
            <span
              className="text-xs font-semibold shrink-0"
              style={{ color: isStarted ? "#f97316" : "rgba(255,255,255,0.3)" }}
            >
              {pct}%
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: barColor }}
            />
          </div>
          <p className="text-[11px] text-white/40">
            <span className="text-white/70 font-medium">{done}</span> de {total} locais visitados
          </p>
        </div>
      </div>
    </Link>
  );
}
