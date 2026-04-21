import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { EditChallengeForm } from "./edit-challenge-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditarDesafioPage({ params }: Props) {
  await verifyModerator();
  const { id } = await params;

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    select: { name: true, description: true, state_code: true, cover_url: true },
  });
  if (!challenge) notFound();

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="px-4 pt-5 pb-2">
        <Link href={`/desafios/${id}`} className="inline-flex items-center gap-1 text-sm text-white/45 hover:text-white/80 transition-colors">
          <ChevronLeft className="size-4" />
          {challenge.name}
        </Link>
      </div>
      <div className="px-4 py-4 space-y-6">
        <h1 className="text-xl font-bold text-white">Editar desafio</h1>
        <EditChallengeForm id={id} name={challenge.name} description={challenge.description} state_code={challenge.state_code} coverUrl={challenge.cover_url} />
      </div>
    </main>
  );
}
