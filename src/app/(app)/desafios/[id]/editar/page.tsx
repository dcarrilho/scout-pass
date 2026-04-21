import { notFound } from "next/navigation";
import Link from "next/link";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { EditChallengeForm } from "./edit-challenge-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditarDesafioPage({ params }: Props) {
  await verifyModerator();
  const { id } = await params;

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    select: { name: true, description: true, state_code: true },
  });
  if (!challenge) notFound();

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="px-4 pt-6 pb-2">
        <Link href={`/desafios/${id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← {challenge.name}
        </Link>
      </div>
      <div className="px-4 py-4 space-y-6">
        <h1 className="text-xl font-bold">Editar desafio</h1>
        <EditChallengeForm id={id} name={challenge.name} description={challenge.description} state_code={challenge.state_code} />
      </div>
    </main>
  );
}
