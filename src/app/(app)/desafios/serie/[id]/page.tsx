import { notFound } from "next/navigation";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { getSeriesColor } from "@/lib/challenge-colors";

type Props = { params: Promise<{ id: string }> };

export default async function SeriesPage({ params }: Props) {
  const session = await verifySession();
  const { id } = await params;

  const series = await prisma.series.findUnique({
    where: { id },
    include: {
      organizer: { select: { name: true, slug: true } },
      challenges: {
        where: { is_active: true },
        include: { _count: { select: { targets: true } } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!series) notFound();

  const challengeIds = series.challenges.map((c) => c.id);
  const userProgress = await prisma.checkIn.groupBy({
    by: ["challenge_id"],
    where: { user_id: session.userId, challenge_id: { in: challengeIds }, status: "APPROVED" },
    _count: { _all: true },
  });
  const progressMap = Object.fromEntries(userProgress.map((c) => [c.challenge_id, c._count._all]));

  const totalTargets = series.challenges.reduce((s, c) => s + c._count.targets, 0);
  const totalDone = series.challenges.reduce((s, c) => s + (progressMap[c.id] ?? 0), 0);
  const overallPct = totalTargets > 0 ? Math.round((totalDone / totalTargets) * 100) : 0;
  const completedCount = series.challenges.filter((c) => {
    const done = progressMap[c.id] ?? 0;
    return c._count.targets > 0 && done >= c._count.targets;
  }).length;

  const color = getSeriesColor(series.color);
  const isMod = session.role === "MODERATOR" || session.role === "ADMIN";

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="px-4 pt-6 pb-2">
        {series.organizer ? (
          <Link href={`/desafios/org/${series.organizer.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← {series.organizer.name}
          </Link>
        ) : (
          <Link href="/desafios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Desafios
          </Link>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Series header */}
        <div className="flex items-center gap-3">
          {series.icon && (
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0", color.icon_bg)}>
              {series.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{series.name}</h1>
              {isMod && (
                <Link
                  href={`/desafios/serie/${id}/editar`}
                  className="rounded-full border px-2.5 py-0.5 text-xs font-medium hover:bg-muted transition-colors shrink-0"
                >
                  Editar
                </Link>
              )}
            </div>
            {series.description && <p className="text-sm text-muted-foreground">{series.description}</p>}
          </div>
        </div>

        {/* Progress card */}
        <div className="rounded-2xl border bg-card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">
              {completedCount} de {series.challenges.length} desafios completos
            </span>
            <span className="text-muted-foreground">{overallPct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", color.progress)} style={{ width: `${overallPct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{totalDone} de {totalTargets} waypoints visitados</p>
        </div>

        {/* Challenge management */}
        {isMod && (
          <div className="flex gap-2">
            <Link
              href={`/desafios/serie/${id}/novo-desafio`}
              className="rounded-full border border-primary text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              + Novo desafio
            </Link>
            <Link
              href={`/desafios/serie/${id}/adicionar-desafio`}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
            >
              Adicionar existente
            </Link>
          </div>
        )}

        {/* Challenge list */}
        <div className="grid gap-3">
          {series.challenges.map((challenge) => {
            const total = challenge._count.targets;
            const done = progressMap[challenge.id] ?? 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const isComplete = pct === 100;

            return (
              <Link key={challenge.id} href={`/desafios/${challenge.id}`}>
                <div className={cn(
                  "rounded-xl border bg-card p-4 space-y-3 hover:shadow-md active:scale-[0.99] transition-all",
                  isComplete && "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm leading-snug flex-1">{challenge.name}</p>
                    {isComplete ? (
                      <span className="text-xs font-bold text-green-600 dark:text-green-400 shrink-0">✅ Completo</span>
                    ) : (
                      <span className={cn("text-xs font-semibold rounded-full px-2 py-0.5 shrink-0", color.badge)}>
                        {pct}%
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", isComplete ? "bg-green-500" : color.progress)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{done} de {total} locais visitados</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
