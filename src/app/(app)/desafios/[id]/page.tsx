import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import WaypointList from "./waypoint-list";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ enviado?: string }> };

export default async function DesafioDetailPage({ params, searchParams }: Props) {
  const session = await verifySession();
  const { id } = await params;
  const { enviado } = await searchParams;

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      targets: { orderBy: [{ order: "asc" }, { name: "asc" }] },
      series: { select: { id: true, name: true, organizer: { select: { name: true, slug: true } } } },
      organizer: { select: { name: true, slug: true } },
    },
  });

  if (!challenge) notFound();

  const [approvedTargets, pendingTargets] = await Promise.all([
    prisma.checkIn.findMany({
      where: { user_id: session.userId, challenge_id: id, status: "APPROVED" },
      select: { target_id: true },
    }),
    prisma.checkIn.findMany({
      where: { user_id: session.userId, challenge_id: id, status: "PENDING" },
      select: { target_id: true },
    }),
  ]);

  const approvedIds = approvedTargets.map((c) => c.target_id);
  const pendingIds = pendingTargets.map((c) => c.target_id);
  const approvedSet = new Set(approvedIds);

  const total = challenge.targets.length;
  const done = approvedSet.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = pct === 100;

  const parentOrg = challenge.series?.organizer ?? challenge.organizer;

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="px-4 pt-6 pb-2">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
          <Link href="/desafios" className="hover:text-foreground transition-colors">Desafios</Link>
          {parentOrg && (
            <>
              <span>/</span>
              <Link href={`/desafios/org/${parentOrg.slug}`} className="hover:text-foreground transition-colors">
                {parentOrg.name}
              </Link>
            </>
          )}
          {challenge.series && (
            <>
              <span>/</span>
              <Link href={`/desafios/serie/${challenge.series.id}`} className="hover:text-foreground transition-colors">
                {challenge.series.name}
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="p-4 space-y-6">
        {/* Header + progress */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-bold leading-tight flex-1">{challenge.name}</h1>
            {(session.role === "MODERATOR" || session.role === "ADMIN") && (
              <Link
                href={`/desafios/${id}/editar`}
                className="rounded-full border px-2.5 py-0.5 text-xs font-medium hover:bg-muted transition-colors shrink-0 mt-1"
              >
                Editar
              </Link>
            )}
          </div>
          {challenge.description && (
            <p className="text-sm text-muted-foreground">{challenge.description}</p>
          )}

          <div className="rounded-2xl border bg-card p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold">
                {isComplete ? "🏆 Desafio completo!" : `${done} de ${total} waypoints`}
              </span>
              <span className={isComplete ? "font-bold text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                {pct}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {pendingIds.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {pendingIds.length} aguardando aprovação
              </p>
            )}
          </div>
        </div>

        {/* Check-in enviado banner */}
        {enviado && (
          <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-800 dark:text-green-300">
            Check-in enviado! Aguardando aprovação do moderador.
          </div>
        )}

        {/* Waypoint list */}
        <WaypointList
          targets={challenge.targets.map((t) => ({ id: t.id, name: t.name }))}
          approvedIds={approvedIds}
          pendingIds={pendingIds}
          challengeId={id}
        />
      </div>
    </main>
  );
}
