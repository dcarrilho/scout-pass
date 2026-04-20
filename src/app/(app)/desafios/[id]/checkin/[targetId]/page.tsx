import { notFound } from "next/navigation";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import CheckInForm from "@/components/challenges/checkin-form";

type Props = { params: Promise<{ id: string; targetId: string }> };

export default async function CheckInPage({ params }: Props) {
  const session = await verifySession();
  const { id, targetId } = await params;

  const [challenge, target, motorcycles] = await Promise.all([
    prisma.challenge.findUnique({ where: { id } }),
    prisma.challengeTarget.findUnique({ where: { id: targetId } }),
    prisma.motorcycle.findMany({ where: { user_id: session.userId, owned_until: null }, orderBy: { owned_from: "desc" } }),
  ]);

  if (!challenge || !target) notFound();

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto py-8 space-y-6">
      <div>
        <Link href={`/desafios/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← {challenge.name}
        </Link>
        <h1 className="text-xl font-bold mt-2">{target.name}</h1>
        <p className="text-sm text-muted-foreground">Envie uma foto para registrar sua visita</p>
      </div>
      <CheckInForm
        challengeId={id}
        targetId={targetId}
        motorcycles={motorcycles}
      />
    </main>
  );
}
