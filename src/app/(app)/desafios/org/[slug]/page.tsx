import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export default async function OrganizerPage({ params }: Props) {
  const session = await verifySession();
  const { slug } = await params;

  const isMod = session.role === "MODERATOR" || session.role === "ADMIN";

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
  const isOrgComplete = overallPct === 100;

  return (
    <main className="min-h-screen max-w-2xl mx-auto">

      {/* Cover header */}
      <div
        className="relative px-4 pt-5 pb-6"
        style={{
          backgroundImage: org.cover_url
            ? `linear-gradient(rgba(12,10,9,0.65), rgba(12,10,9,0.65)), url(${org.cover_url})`
            : `radial-gradient(ellipse at 10% 120%, rgba(249,115,22,0.18), transparent 55%), repeating-linear-gradient(135deg, #1a1614 0 10px, #141210 10px 20px)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link
          href="/desafios"
          className="inline-flex items-center gap-1 text-sm text-white/45 hover:text-white/80 transition-colors mb-5"
        >
          <ChevronLeft className="size-4" />
          Desafios
        </Link>

        <div className="flex items-center gap-4">
          {org.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logo_url} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" style={{ border: "2px solid rgba(255,255,255,0.1)" }} />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
              style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "2px solid rgba(249,115,22,0.25)" }}
            >
              {org.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">{org.name}</h1>
              {isMod && (
                <Link
                  href={`/desafios/org/${slug}/editar`}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white/50 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Editar
                </Link>
              )}
            </div>
            {org.description && <p className="text-sm text-white/50 mt-0.5">{org.description}</p>}
          </div>
        </div>

        {totalTargets > 0 && (
          <div className="mt-5 space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-bold" style={{ color: isOrgComplete ? "#16a34a" : "#f97316" }}>
                  {overallPct}%
                </span>
                <span className="text-xs text-white/40 ml-2">concluído</span>
              </div>
              <p className="text-xs text-white/40 pb-0.5">
                {totalDone} de {totalTargets} waypoints · {allChallengesFlat.length} desafios
              </p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${overallPct}%`, background: isOrgComplete ? "#16a34a" : "#f97316" }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-4">

        {/* Mod management */}
        {isMod && (
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">Administração</p>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <AdminBtn href={`/desafios/org/${slug}/nova-serie`} primary>+ Nova série</AdminBtn>
                <AdminBtn href={`/desafios/org/${slug}/adicionar-serie`}>Adicionar série existente</AdminBtn>
              </div>
              <div className="flex flex-wrap gap-2">
                <AdminBtn href={`/desafios/org/${slug}/novo-desafio`} primary>+ Novo desafio</AdminBtn>
                <AdminBtn href={`/desafios/org/${slug}/adicionar-desafio`}>Adicionar desafio existente</AdminBtn>
              </div>
            </div>
          </div>
        )}

        {/* Series cards */}
        {org.series.length > 0 && (
          <section className="space-y-3">
            <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">Séries</p>
            <div className="grid gap-3">
              {org.series.map((series) => {
                const seriesTotal = series.challenges.reduce((s, c) => s + c._count.targets, 0);
                const seriesDone = series.challenges.reduce((s, c) => s + (progressMap[c.id] ?? 0), 0);
                const seriesPct = seriesTotal > 0 ? Math.round((seriesDone / seriesTotal) * 100) : 0;
                const seriesComplete = seriesPct === 100;

                return (
                  <Link key={series.id} href={`/desafios/serie/${series.id}`}>
                    <div
                      className="rounded-2xl p-4 space-y-3 transition-all active:scale-[0.99]"
                      style={{
                        background: seriesComplete ? "rgba(22,163,74,0.06)" : "#161412",
                        border: `1px solid ${seriesComplete ? "rgba(22,163,74,0.3)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {series.icon && (
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                          >
                            {series.icon}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-white">{series.name}</p>
                            {seriesComplete && (
                              <span
                                className="text-[10px] font-semibold rounded-full px-2 py-0.5 flex items-center gap-1 shrink-0"
                                style={{ background: "rgba(22,163,74,0.12)", color: "#16a34a" }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] inline-block" />
                                Completa
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/40 mt-0.5">
                            {series.challenges.length} desafio{series.challenges.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <span
                          className="text-sm font-bold shrink-0"
                          style={{ color: seriesComplete ? "#16a34a" : "#f97316" }}
                        >
                          {seriesPct}%
                        </span>
                      </div>
                      {seriesTotal > 0 && (
                        <div className="space-y-1.5">
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${seriesPct}%`, background: seriesComplete ? "#16a34a" : "#f97316" }}
                            />
                          </div>
                          <p className="text-[11px] text-white/35">
                            <span className="text-white/55">{seriesDone}</span> de {seriesTotal} waypoints
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Standalone challenges */}
        {org.challenges.length > 0 && (
          <section className="space-y-3">
            <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">Desafios avulsos</p>
            <div className="grid gap-3">
              {org.challenges.map((challenge) => {
                const total = challenge._count.targets;
                const done = progressMap[challenge.id] ?? 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const isComplete = pct === 100;
                const isStarted = done > 0;

                return (
                  <Link key={challenge.id} href={`/desafios/${challenge.id}`}>
                    <div
                      className="rounded-xl p-4 space-y-3 transition-all active:scale-[0.99]"
                      style={{
                        background: isComplete ? "rgba(22,163,74,0.06)" : isStarted ? "rgba(249,115,22,0.05)" : "#161412",
                        border: `1px solid ${isComplete ? "rgba(22,163,74,0.3)" : isStarted ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-sm text-white leading-snug">{challenge.name}</p>
                        {isComplete ? (
                          <span className="text-[10px] font-semibold rounded-full px-2.5 py-1 shrink-0 flex items-center gap-1" style={{ background: "rgba(22,163,74,0.12)", color: "#16a34a" }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] inline-block" />
                            Completo
                          </span>
                        ) : (
                          <span className="text-xs font-semibold shrink-0" style={{ color: isStarted ? "#f97316" : "rgba(255,255,255,0.3)" }}>
                            {pct}%
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: isComplete ? "#16a34a" : "#f97316" }} />
                        </div>
                        <p className="text-[11px] text-white/40">
                          <span className="text-white/70 font-medium">{done}</span> de {total} locais visitados
                        </p>
                      </div>
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

function AdminBtn({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
      style={
        primary
          ? { background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }
          : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }
      }
    >
      {children}
    </Link>
  );
}
