import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, {
  label: string;
  icon: string;
  progressColor: string;
  badgeClass: string;
  headerClass: string;
}> = {
  VALENTE:     { label: "Valente",     icon: "🏙️", progressColor: "bg-blue-500",    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",    headerClass: "text-blue-700 dark:text-blue-400" },
  BANDEIRANTE: { label: "Bandeirante", icon: "🏛️", progressColor: "bg-amber-500",   badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", headerClass: "text-amber-700 dark:text-amber-400" },
  CARDEAL:     { label: "Cardeal",     icon: "🧭", progressColor: "bg-purple-500",   badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",headerClass: "text-purple-700 dark:text-purple-400" },
  RODOVIARIO:  { label: "Rodoviário",  icon: "🛣️", progressColor: "bg-emerald-500",  badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",headerClass: "text-emerald-700 dark:text-emerald-400" },
  LENDARIO:    { label: "Lendário",    icon: "⭐", progressColor: "bg-orange-500",   badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",headerClass: "text-orange-700 dark:text-orange-400" },
};

const TYPE_ORDER = ["VALENTE", "BANDEIRANTE", "CARDEAL", "RODOVIARIO", "LENDARIO"];

export default async function DesafiosPage() {
  const session = await verifySession();

  const challenges = await prisma.challenge.findMany({
    where: { is_active: true },
    include: { _count: { select: { targets: true } } },
    orderBy: [{ type: "asc" }, { state_code: "asc" }],
  });

  const approvedCheckIns = await prisma.checkIn.groupBy({
    by: ["challenge_id"],
    where: { user_id: session.userId, status: "APPROVED" },
    _count: { _all: true },
  });

  const progressMap = Object.fromEntries(
    approvedCheckIns.map((c) => [c.challenge_id, c._count._all])
  );

  const grouped = challenges.reduce<Record<string, typeof challenges>>(
    (acc, c) => {
      if (!acc[c.type]) acc[c.type] = [];
      acc[c.type].push(c);
      return acc;
    },
    {}
  );

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3">
        <h1 className="text-lg font-bold">Desafios</h1>
      </header>

      <div className="p-4 space-y-8">
        {TYPE_ORDER.filter((t) => grouped[t]).map((type) => {
          const config = TYPE_CONFIG[type] ?? { label: type, icon: "🏆", progressColor: "bg-primary", badgeClass: "", headerClass: "" };
          const list = grouped[type];

          return (
            <section key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{config.icon}</span>
                <h2 className={cn("text-base font-bold", config.headerClass)}>{config.label}</h2>
                <span className="text-xs text-muted-foreground ml-auto">{list.length} desafios</span>
              </div>

              <div className="grid gap-3">
                {list.map((challenge) => {
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
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 shrink-0 flex items-center gap-1">
                              ✅ Completo
                            </span>
                          ) : (
                            <span className={cn("text-xs font-semibold rounded-full px-2 py-0.5 shrink-0", config.badgeClass)}>
                              {pct}%
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", isComplete ? "bg-green-500" : config.progressColor)}
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
            </section>
          );
        })}
      </div>
    </main>
  );
}
