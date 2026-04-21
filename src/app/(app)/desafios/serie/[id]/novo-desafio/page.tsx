import { notFound } from "next/navigation";
import Link from "next/link";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ChallengeForm } from "./challenge-form";

type Props = { params: Promise<{ id: string }> };

export default async function NovoChallengesPage({ params }: Props) {
  await verifyModerator();
  const { id } = await params;

  const series = await prisma.series.findUnique({
    where: { id },
    select: { name: true, organizer: { select: { slug: true } } },
  });
  if (!series) notFound();

  const backHref = series.organizer
    ? `/desafios/org/${series.organizer.slug}`
    : `/desafios/serie/${id}`;

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="px-4 pt-6 pb-2">
        <Link href={backHref} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← {series.name}
        </Link>
      </div>

      <div className="px-4 py-4 space-y-6">
        <h1 className="text-xl font-bold">Novo desafio</h1>
        <ChallengeForm seriesId={id} />
      </div>
    </main>
  );
}
