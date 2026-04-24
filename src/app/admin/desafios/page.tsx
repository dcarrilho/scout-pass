import { verifyAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { toggleChallengeActive } from "@/app/actions/admin";

export default async function AdminDesafiosPage() {
  await verifyAdmin();

  const challenges = await prisma.challenge.findMany({
    include: {
      series: { select: { name: true, icon: true } },
      organizer: { select: { name: true } },
      _count: { select: { targets: true, checkins: true, participants: true } },
    },
    orderBy: [{ is_active: "desc" }, { created_at: "desc" }],
  });

  const active = challenges.filter((c) => c.is_active).length;
  const inactive = challenges.length - active;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Ativos", value: active, color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
          { label: "Inativos", value: inactive, color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.04)" },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="rounded-xl px-4 py-3 text-center"
            style={{ background: bg, border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: challenge.is_active ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${challenge.is_active ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)"}`,
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {challenge.series?.icon && (
                  <span className="text-base">{challenge.series.icon}</span>
                )}
                <p
                  className="text-sm font-semibold leading-tight"
                  style={{ color: challenge.is_active ? "white" : "rgba(255,255,255,0.4)" }}
                >
                  {challenge.name}
                </p>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {challenge.organizer?.name ?? challenge.series?.name ?? "—"}
                {" · "}
                {challenge._count.targets} locais
                {" · "}
                {challenge._count.participants} participantes
                {" · "}
                {challenge._count.checkins} check-ins
              </p>
            </div>

            <form action={toggleChallengeActive.bind(null, challenge.id, !challenge.is_active)}>
              <button
                type="submit"
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                style={
                  challenge.is_active
                    ? { background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }
                    : { background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.25)" }
                }
              >
                {challenge.is_active ? "Desativar" : "Ativar"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
