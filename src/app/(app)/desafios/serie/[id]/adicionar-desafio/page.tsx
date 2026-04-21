import { notFound } from "next/navigation";
import Link from "next/link";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { linkChallengeToSeries } from "@/app/actions/challenges";

type Props = { params: Promise<{ id: string }> };

export default async function AdicionarDesafioPage({ params }: Props) {
  await verifyModerator();
  const { id } = await params;

  const series = await prisma.series.findUnique({
    where: { id },
    select: {
      name: true,
      organizer: { select: { slug: true } },
      challenges: { select: { id: true } },
    },
  });
  if (!series) notFound();

  const existingIds = series.challenges.map((c) => c.id);

  const available = await prisma.challenge.findMany({
    where: { is_active: true, series_id: null, id: { notIn: existingIds } },
    select: { id: true, name: true, state_code: true, _count: { select: { targets: true } } },
    orderBy: { name: "asc" },
  });

  const backHref = `/desafios/serie/${id}`;

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="px-4 pt-6 pb-2">
        <Link href={backHref} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← {series.name}
        </Link>
      </div>

      <div className="px-4 py-4 space-y-4">
        <h1 className="text-xl font-bold">Adicionar desafio</h1>

        {available.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center space-y-2">
            <p className="font-semibold text-sm">Nenhum desafio disponível</p>
            <p className="text-xs text-muted-foreground">
              Todos os desafios ativos já estão vinculados a uma série.
            </p>
            <Link
              href={`/desafios/serie/${id}/novo-desafio`}
              className="inline-block mt-3 text-sm text-primary hover:underline"
            >
              Criar novo desafio →
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {available.map((challenge) => {
              const action = linkChallengeToSeries.bind(null, challenge.id, id);
              return (
                <div key={challenge.id} className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{challenge.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {challenge.state_code && `${challenge.state_code} · `}
                      {challenge._count.targets} waypoints
                    </p>
                  </div>
                  <form action={action}>
                    <button
                      type="submit"
                      className="rounded-full border border-primary text-primary px-3 py-1 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                    >
                      Adicionar
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
