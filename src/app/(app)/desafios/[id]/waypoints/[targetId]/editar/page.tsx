import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Trash2 } from "lucide-react";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { EditWaypointForm } from "./edit-waypoint-form";
import { deleteTarget } from "@/app/actions/targets";

type Props = { params: Promise<{ id: string; targetId: string }> };

export default async function EditarWaypointPage({ params }: Props) {
  await verifyModerator();
  const { id, targetId } = await params;

  const target = await prisma.challengeTarget.findUnique({
    where: { id: targetId },
    include: { challenge: { select: { name: true } } },
  });
  if (!target || target.challenge_id !== id) notFound();

  const deleteAction = deleteTarget.bind(null, targetId, id);

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="px-4 pt-5 pb-2">
        <Link
          href={`/desafios/${id}`}
          className="inline-flex items-center gap-1 text-sm text-white/45 hover:text-white/80 transition-colors"
        >
          <ChevronLeft className="size-4" />
          {target.challenge.name}
        </Link>
      </div>

      <div className="px-4 py-4 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-white">Editar waypoint</h1>
          <form action={deleteAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <Trash2 className="size-3.5" />
              Remover
            </button>
          </form>
        </div>

        <EditWaypointForm
          targetId={targetId}
          challengeId={id}
          name={target.name}
          type={target.type}
          order={target.order}
          latitude={target.latitude}
          longitude={target.longitude}
        />
      </div>
    </main>
  );
}
