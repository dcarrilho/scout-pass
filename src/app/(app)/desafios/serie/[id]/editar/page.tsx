import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { EditSeriesForm } from "./edit-series-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditarSeriePage({ params }: Props) {
  await verifyModerator();
  const { id } = await params;

  const series = await prisma.series.findUnique({
    where: { id },
    select: { name: true, description: true, icon: true, color: true, organizer: { select: { slug: true } } },
  });
  if (!series) notFound();

  const backHref = series.organizer ? `/desafios/org/${series.organizer.slug}` : "/desafios";

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="px-4 pt-5 pb-2">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-white/45 hover:text-white/80 transition-colors">
          <ChevronLeft className="size-4" />
          {series.name}
        </Link>
      </div>
      <div className="px-4 py-4 space-y-6">
        <h1 className="text-xl font-bold text-white">Editar série</h1>
        <EditSeriesForm id={id} name={series.name} description={series.description} icon={series.icon} color={series.color} />
      </div>
    </main>
  );
}
