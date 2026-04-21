import { notFound } from "next/navigation";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { getSeriesColor } from "@/lib/challenge-colors";

type Props = { params: Promise<{ slug: string }> };

export default async function OrganizerPage({ params }: Props) {
  const session = await verifySession();
  const { slug } = await params;

  const org = await prisma.organizer.findUnique({
    where: { slug },
    include: {
      series: {
        where: { is_active: true },
        include: {
          challenges: {
            where: { is_active: true },
            select: { id: true, name: true, _count: { select: { targets: true } } },
            orderBy: { name: "asc" },
          },
        },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      },
      challenges: {
        where: { is_active: true, series_id: null },
        select: { id: true, name: true, _count: { select: { targets: true } } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!org) notFound();

  const allChallengeIds = [
    ...org.challenges.map((c) => c.id),
    ...org.series.flatMap((s) => s.challenges.map((c) => c.id)),
  ];

  const userProgress = await prisma.checkIn.groupBy({
    by: ["challenge_id"],
    where: { user_id: session.userId, challenge_id: { in: allChallengeIds }, status: "APPROVED" },
    _count: { _all: true },
  });
  const progressMap = Object.fromEntries(userProgress.map((c) => [c.challenge_id, c._count._all]));

  const allChallengesFlat = [
    ...org.challenges,
    ...org.series.flatMap((s) => s.challenges),
  ];
  const totalTargets = allChallengesFlat.reduce((s, c) => s + c._count.targets, 0);
  const totalDone = allChallengesFlat.reduce((s, c) => s + (progressMap[c.id] ?? 0), 0);
  const overallPct = totalTargets > 0 ? Math.round((totalDone / totalTargets) * 100) : 0;

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="px-4 pt-6 pb-2">
        <Link href="/desafios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Desafios
        </Link>
      </div>

      <div className="p-4 space-y-6">
        {/* Org header */}
        <div className="flex items-center gap-4">
          {org.logo_url ? (
            <img src={org.logo_url} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
              {org.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{org.name}</h1>
            {org.description && <p className="text-sm text-muted-foreground">{org.description}</p>}
          </div>
        </div>

        {/* Overall progress */}
        {totalTargets > 0 && (
          <div className="rounded-2xl border bg-card p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Progresso geral</span>
              <span className="text-muted-foreground">{overallPct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${overallPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              {totalDone} de {totalTargets} waypoints · {allChallengesFlat.length} desafios
            </p>
          </div>
        )}

        {/* Series sections */}
        {org.series.map((series) => {
          const color = getSeriesColor(series.color);
          const seriesTotal = series.challenges.reduce((s, c) => s + c._count.targets, 0);
          const seriesDone = series.challenges.reduce((s, c) => s + (progressMap[c.id] ?? 0), 0);
          const seriesPct = seriesTotal > 0 ? Math.round((seriesDone / seriesTotal) * 100) : 0;

          return (
            <section key={series.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {series.icon && <span className="text-xl">{series.icon}</span>}
                  <h2 className={cn("font-bold text-base", color.header)}>{series.name}</h2>
                </div>
                <Link href={`/desafios/serie/${series.id}`} className="text-xs text-primary hover:underline shrink-0">
                  Ver todos →
                </Link>
              </div>

              {seriesTotal > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", color.progress)} style={{ width: `${seriesPct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {seriesDone} de {seriesTotal} waypoints · {seriesPct}%
                  </p>
                </div>
              )}

              <div className="grid gap-2">
                {series.challenges.slice(0, 4).map((challenge) => {
                  const total = challenge._count.targets;
                  const done = progressMap[challenge.id] ?? 0;
                  const isComplete = total > 0 && done >= total;
                  return (
                    <Link key={challenge.id} href={`/desafios/${challenge.id}`}>
                      <div className={cn(
                        "rounded-xl border bg-card px-4 py-3 flex items-center gap-3 hover:shadow-sm active:scale-[0.99] transition-all",
                        isComplete && "border-green-200 dark:border-green-800"
                      )}>
                        <span className="text-base shrink-0">{isComplete ? "✅" : "⭕"}</span>
                        <span className="text-sm flex-1 truncate">{challenge.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{done}/{total}</span>
                      </div>
                    </Link>
                  );
                })}
                {series.challenges.length > 4 && (
                  <Link href={`/desafios/serie/${series.id}`} className="text-center text-xs text-primary py-2 hover:underline block">
                    +{series.challenges.length - 4} desafios nesta série
                  </Link>
                )}
              </div>
            </section>
          );
        })}

        {/* Direct challenges (no series) */}
        {org.challenges.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-bold text-base text-muted-foreground">Desafios avulsos</h2>
            <div className="grid gap-2">
              {org.challenges.map((challenge) => {
                const total = challenge._count.targets;
                const done = progressMap[challenge.id] ?? 0;
                const isComplete = total > 0 && done >= total;
                return (
                  <Link key={challenge.id} href={`/desafios/${challenge.id}`}>
                    <div className={cn(
                      "rounded-xl border bg-card px-4 py-3 flex items-center gap-3 hover:shadow-sm active:scale-[0.99] transition-all",
                      isComplete && "border-green-200 dark:border-green-800"
                    )}>
                      <span className="text-base shrink-0">{isComplete ? "✅" : "⭕"}</span>
                      <span className="text-sm flex-1 truncate">{challenge.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{done}/{total}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
