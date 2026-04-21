import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function DesafiosPage() {
  const session = await verifySession();

  const [allChallenges, userProgress, organizers, allSeries] = await Promise.all([
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
  ]);

  const progressMap = Object.fromEntries(userProgress.map((c) => [c.challenge_id, c._count._all]));

  // Partition challenges
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

  function orgStats(orgId: string) {
    const seriesIds = allSeries.filter((s) => s.organizer_id === orgId).map((s) => s.id);
    const challenges = [
      ...(byOrg[orgId] ?? []),
      ...seriesIds.flatMap((sid) => bySeries[sid] ?? []),
    ];
    const total = challenges.reduce((s, c) => s + c._count.targets, 0);
    const done = challenges.reduce((s, c) => s + (progressMap[c.id] ?? 0), 0);
    return { count: challenges.length, total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }

  const isEmpty = organizers.length === 0 && standalone.length === 0;

  const hasQuickNav = organizers.length > 1;

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="pt-6 space-y-8">
        <div className="px-4">
          <h1 className="text-xl font-bold">Desafios</h1>
        </div>

        {/* Quick-nav chip strip */}
        {hasQuickNav && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
            {organizers.map((org) => (
              <Link
                key={org.id}
                href={`/desafios/org/${org.slug}`}
                className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 hover:bg-muted transition-colors"
              >
                {org.logo_url
                  ? <img src={org.logo_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                  : <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">{org.name[0]}</span>
                }
                {org.name}
              </Link>
            ))}
          </div>
        )}

        <div className="px-4 space-y-8 pb-6">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="text-5xl">🗺️</span>
            <p className="font-semibold">Nenhum desafio disponível</p>
            <p className="text-sm text-muted-foreground">Volte em breve para novidades.</p>
          </div>
        )}

        {/* Organizers */}
        {organizers.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Organizadores</p>
            <div className="grid gap-3">
              {organizers.map((org) => {
                const { pct, count, done, total } = orgStats(org.id);
                return (
                  <Link key={org.id} href={`/desafios/org/${org.slug}`}>
                    <div className="rounded-2xl border bg-card p-4 space-y-3 hover:shadow-md active:scale-[0.99] transition-all">
                      <div className="flex items-center gap-3">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-lg shrink-0">
                            {org.name[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{org.name}</p>
                          {org.description && (
                            <p className="text-xs text-muted-foreground truncate">{org.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{count} desafios</span>
                      </div>
                      {total > 0 && (
                        <div className="space-y-1">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground">{done} de {total} waypoints · {pct}%</p>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Standalone Challenges */}
        {standalone.length > 0 && (
          <section className="space-y-3">
            {(organizers.length > 0 || standaloneSeries.length > 0) && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avulsos</p>
            )}
            <div className="grid gap-3">
              {standalone.map((challenge) => {
                const total = challenge._count.targets;
                const done = progressMap[challenge.id] ?? 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const isComplete = pct === 100;
                return (
                  <Link key={challenge.id} href={`/desafios/${challenge.id}`}>
                    <div className={cn(
                      "rounded-xl border bg-card p-4 space-y-3 transition-all hover:shadow-md active:scale-[0.99]",
                      isComplete && "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10"
                    )}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm leading-snug flex-1">{challenge.name}</p>
                        {isComplete ? (
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 shrink-0">✅ Completo</span>
                        ) : (
                          <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", isComplete ? "bg-green-500" : "bg-primary")} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground">{done} de {total} locais visitados</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        </div>
      </div>
    </main>
  );
}
