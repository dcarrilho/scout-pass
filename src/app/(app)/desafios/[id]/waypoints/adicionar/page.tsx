import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AddExistingWaypointForm } from "./add-existing-waypoint-form";

type Props = { params: Promise<{ id: string }> };

export default async function AdicionarWaypointPage({ params }: Props) {
  await verifyModerator();
  const { id } = await params;

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    select: { name: true, targets: { select: { id: true } } },
  });
  if (!challenge) notFound();

  const currentTargetIds = challenge.targets.map((t) => t.id);

  // Waypoints que ainda não estão neste desafio
  const available = await prisma.challengeTarget.findMany({
    where: { id: { notIn: currentTargetIds } },
    select: { id: true, name: true, type: true, challenges: { select: { name: true }, take: 1 } },
    orderBy: { name: "asc" },
    take: 200,
  });

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="px-4 pt-5 pb-2">
        <Link
          href={`/desafios/${id}`}
          className="inline-flex items-center gap-1 text-sm text-white/45 hover:text-white/80 transition-colors"
        >
          <ChevronLeft className="size-4" />
          {challenge.name}
        </Link>
      </div>

      <div className="px-4 py-4 space-y-5">
        <h1 className="text-xl font-bold text-white">Adicionar waypoint existente</h1>
        <p className="text-sm text-white/40">
          Vincule um waypoint já cadastrado em outro desafio a este.
        </p>
        <AddExistingWaypointForm challengeId={id} available={available} />
      </div>
    </main>
  );
}
