import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
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

      {/* Cover header */}
      <div
        className="relative px-4 pt-5 pb-6 overflow-hidden"
        style={{
          background: challenge.cover_url ? "#0f0d0c" : `
            radial-gradient(ellipse at 10% 120%, rgba(249,115,22,0.18), transparent 55%),
            repeating-linear-gradient(135deg, #1a1614 0 10px, #141210 10px 20px)
          `,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {challenge.cover_url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={challenge.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "rgba(12,10,9,0.62)" }} />
          </>
        )}
        {/* Back / breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm mb-5 flex-wrap">
          <Link href="/desafios" className="inline-flex items-center gap-1 text-white/45 hover:text-white/80 transition-colors">
            <ChevronLeft className="size-4" />
            Desafios
          </Link>
          {parentOrg && (
            <>
              <span className="text-white/20">/</span>
              <Link href={`/desafios/org/${parentOrg.slug}`} className="text-white/45 hover:text-white/80 transition-colors">
                {parentOrg.name}
              </Link>
            </>
          )}
          {challenge.series && (
            <>
              <span className="text-white/20">/</span>
              <Link href={`/desafios/serie/${challenge.series.id}`} className="text-white/45 hover:text-white/80 transition-colors">
                {challenge.series.name}
              </Link>
            </>
          )}
        </nav>

        {/* Title + edit */}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-white leading-tight flex-1">{challenge.name}</h1>
          {(session.role === "MODERATOR" || session.role === "ADMIN") && (
            <Link
              href={`/desafios/${id}/editar`}
              className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white/50 hover:text-white transition-colors mt-1 shrink-0"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Editar
            </Link>
          )}
        </div>

        {challenge.description && (
          <p className="text-sm text-white/50 mt-1.5">{challenge.description}</p>
        )}

        {/* Progress */}
        {total > 0 && (
          <div className="mt-5 space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-bold" style={{ color: isComplete ? "#16a34a" : "#f97316" }}>
                  {pct}%
                </span>
                <span className="text-xs text-white/40 ml-2">
                  {isComplete ? "completo 🏆" : "concluído"}
                </span>
              </div>
              <p className="text-xs text-white/40 pb-0.5">
                {done} de {total} waypoints
                {pendingIds.length > 0 && (
                  <span style={{ color: "rgba(251,146,60,0.9)" }}> · {pendingIds.length} aguardando</span>
                )}
              </p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: isComplete ? "#16a34a" : "#f97316" }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Check-in enviado banner */}
        {enviado && (
          <div
            className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.25)", color: "#16a34a" }}
          >
            ✓ Check-in enviado! Aguardando aprovação do moderador.
          </div>
        )}

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
