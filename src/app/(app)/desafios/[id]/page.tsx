import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ enviado?: string }> };

export default async function DesafioDetailPage({ params, searchParams }: Props) {
  const session = await verifySession();
  const { id } = await params;
  const { enviado } = await searchParams;

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      targets: { orderBy: [{ order: "asc" }, { name: "asc" }] },
    },
  });

  if (!challenge) notFound();

  const approvedTargets = await prisma.checkIn.findMany({
    where: { user_id: session.userId, challenge_id: id, status: "APPROVED" },
    select: { target_id: true },
  });
  const pendingTargets = await prisma.checkIn.findMany({
    where: { user_id: session.userId, challenge_id: id, status: "PENDING" },
    select: { target_id: true },
  });

  const approvedSet = new Set(approvedTargets.map((c) => c.target_id));
  const pendingSet = new Set(pendingTargets.map((c) => c.target_id));

  const total = challenge.targets.length;
  const done = approvedSet.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/desafios" className="text-sm text-muted-foreground hover:underline">← Desafios</Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{challenge.name}</h1>
        {challenge.description && <p className="text-muted-foreground text-sm">{challenge.description}</p>}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{done} / {total} conquistados</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {enviado && (
        <div className="bg-green-50 border border-green-200 rounded-md px-4 py-3 text-sm text-green-800">
          Check-in enviado! Aguardando aprovação do moderador.
        </div>
      )}

      <div className="space-y-2">
        {challenge.targets.map((target) => {
          const isApproved = approvedSet.has(target.id);
          const isPending = pendingSet.has(target.id);

          return (
            <div
              key={target.id}
              className="flex items-center justify-between border rounded-md px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {isApproved ? "✅" : isPending ? "⏳" : "⭕"}
                </span>
                <span className={isApproved ? "line-through text-muted-foreground" : ""}>{target.name}</span>
              </div>
              {!isApproved && !isPending && (
                <Link
                  href={`/desafios/${challenge.id}/checkin/${target.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Check-in
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
