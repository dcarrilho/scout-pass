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
          background: `
            radial-gradient(ellipse at 10% 120%, rgba(249,115,22,0.18), transparent 55%),
            repeating-linear-gradient(135deg, #1a1614 0 10px, #141210 10px 20px)
          `,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Back link */}
        <Link
          href="/desafios"
          className="inline-flex items-center gap-1 text-sm text-white/45 hover:text-white/80 transition-colors mb-5"
        >
          <ChevronLeft className="size-4" />
          Desafios
        </Link>

        {/* Org identity */}
        <div className="flex items-center gap-4">
          {org.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
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
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors text-white/50 hover:text-white"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Editar
                </Link>
              )}
            </div>
            {org.description && (
              <p className="text-sm text-white/50 mt-0.5">{org.description}</p>
            )}
          </div>
        </div>

        {/* Overall progress */}
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

      <div className="px-4 py-5 space-y-7">

        {/* Mod management buttons */}
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

        {/* Series */}
        {org.series.map((series) => {
          const seriesTotal = series.challenges.reduce((s, c) => s + c._count.targets, 0);
          const seriesDone = series.challenges.reduce((s, c) => s + (progressMap[c.id] ?? 0), 0);
          const seriesPct = seriesTotal > 0 ? Math.round((seriesDone / seriesTotal) * 100) : 0;
          const seriesComplete = seriesPct === 100;
          const preview = series.challenges.slice(0, 4);
          const remainder = series.challenges.length - 4;

          return (
            <section key={series.id} className="space-y-3">
              {/* Series header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {series.icon && <span className="text-lg">{series.icon}</span>}
                  <h2 className="font-bold text-base text-white">{series.name}</h2>
                  {seriesComplete && (
                    <span
                      className="text-[10px] font-semibold rounded-full px-2 py-0.5 flex items-center gap-1"
                      style={{ background: "rgba(22,163,74,0.12)", color: "#16a34a" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] inline-block" />
                      Completa
                    </span>
                  )}
                </div>
                <Link
                  href={`/desafios/serie/${series.id}`}
                  className="text-xs font-medium transition-colors"
                  style={{ color: "#f97316" }}
                >
                  Ver todos →
                </Link>
              </div>

              {/* Series progress bar */}
              {seriesTotal > 0 && (
                <div className="space-y-1.5">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${seriesPct}%`, background: seriesComplete ? "#16a34a" : "#f97316" }}
                    />
                  </div>
                  <p className="text-[11px] text-white/35">
                    <span className="text-white/60">{seriesDone}</span> de {seriesTotal} waypoints · {seriesPct}%
                  </p>
                </div>
              )}

              {/* Challenge rows */}
              <div className="grid gap-2">
                {preview.map((challenge) => (
                  <ChallengeRow
                    key={challenge.id}
                    id={challenge.id}
                    name={challenge.name}
                    done={progressMap[challenge.id] ?? 0}
                    total={challenge._count.targets}
                  />
                ))}
                {remainder > 0 && (
                  <Link
                    href={`/desafios/serie/${series.id}`}
                    className="text-center text-xs py-2.5 rounded-xl transition-colors font-medium"
                    style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)" }}
                  >
                    +{remainder} desafio{remainder > 1 ? "s" : ""} nesta série
                  </Link>
                )}
              </div>
            </section>
          );
        })}

        {/* Standalone challenges */}
        {org.challenges.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">Desafios avulsos</h2>
            <div className="grid gap-2">
              {org.challenges.map((challenge) => (
                <ChallengeRow
                  key={challenge.id}
                  id={challenge.id}
                  name={challenge.name}
                  done={progressMap[challenge.id] ?? 0}
                  total={challenge._count.targets}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function ChallengeRow({ id, name, done, total }: { id: string; name: string; done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = pct === 100;
  const isStarted = done > 0;

  const borderColor = isComplete
    ? "rgba(22,163,74,0.3)"
    : isStarted
    ? "rgba(249,115,22,0.25)"
    : "rgba(255,255,255,0.06)";

  const bgColor = isComplete
    ? "rgba(22,163,74,0.06)"
    : isStarted
    ? "rgba(249,115,22,0.05)"
    : "rgba(255,255,255,0.03)";

  return (
    <Link href={`/desafios/${id}`}>
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all active:scale-[0.99]"
        style={{ background: bgColor, border: `1px solid ${borderColor}` }}
      >
        <span className="text-base shrink-0">
          {isComplete ? "🏆" : isStarted ? "🎯" : "⭕"}
        </span>
        <span className="text-sm text-white/85 flex-1 truncate">{name}</span>
        <span
          className="text-xs tabular-nums shrink-0 font-medium"
          style={{ color: isComplete ? "#16a34a" : isStarted ? "#f97316" : "rgba(255,255,255,0.3)" }}
        >
          {done}/{total}
        </span>
      </div>
    </Link>
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
