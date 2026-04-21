import { notFound } from "next/navigation";
import Link from "next/link";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { linkSeriesToOrg } from "@/app/actions/challenges";

type Props = { params: Promise<{ slug: string }> };

export default async function AdicionarSeriesPage({ params }: Props) {
  await verifyModerator();
  const { slug } = await params;

  const org = await prisma.organizer.findUnique({
    where: { slug },
    select: { id: true, name: true, series: { select: { id: true } } },
  });
  if (!org) notFound();

  const existingIds = org.series.map((s) => s.id);

  const available = await prisma.series.findMany({
    where: { is_active: true, id: { notIn: existingIds }, organizer_id: null },
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="px-4 pt-6 pb-2">
        <Link
          href={`/desafios/org/${slug}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {org.name}
        </Link>
      </div>

      <div className="px-4 py-4 space-y-4">
        <h1 className="text-xl font-bold">Adicionar série</h1>

        {available.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center space-y-2">
            <p className="font-semibold text-sm">Nenhuma série disponível</p>
            <p className="text-xs text-muted-foreground">
              Todas as séries ativas já estão vinculadas a uma organização.
            </p>
            <Link
              href={`/desafios/org/${slug}/nova-serie`}
              className="inline-block mt-3 text-sm text-primary hover:underline"
            >
              Criar nova série →
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {available.map((series) => {
              const action = linkSeriesToOrg.bind(null, series.id, slug);
              return (
                <div key={series.id} className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3">
                  {series.icon && <span className="text-xl shrink-0">{series.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{series.name}</p>
                    {series.description && (
                      <p className="text-xs text-muted-foreground truncate">{series.description}</p>
                    )}
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
