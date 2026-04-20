import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TYPE_LABEL: Record<string, string> = {
  VALENTE: "Valente",
  BANDEIRANTE: "Bandeirante",
  CARDEAL: "Cardeal",
  RODOVIARIO: "Rodoviário",
  LENDARIO: "Lendário",
};

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
      const key = c.type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    },
    {}
  );

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">Desafios</h1>

      {Object.entries(grouped).map(([type, list]) => (
        <section key={type} className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">{TYPE_LABEL[type] ?? type}</h2>
          <div className="grid gap-3">
            {list.map((challenge) => {
              const total = challenge._count.targets;
              const done = progressMap[challenge.id] ?? 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <Link key={challenge.id} href={`/desafios/${challenge.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{challenge.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{done} / {total} locais</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
