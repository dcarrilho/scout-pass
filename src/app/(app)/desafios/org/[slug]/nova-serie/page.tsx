import { notFound } from "next/navigation";
import Link from "next/link";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { SeriesForm } from "./series-form";

type Props = { params: Promise<{ slug: string }> };

export default async function NovaSeriesPage({ params }: Props) {
  await verifyModerator();
  const { slug } = await params;

  const org = await prisma.organizer.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!org) notFound();

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

      <div className="px-4 py-4 space-y-6">
        <h1 className="text-xl font-bold">Nova série</h1>
        <SeriesForm organizerId={org.id} />
      </div>
    </main>
  );
}
