import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import RejectForm from "./reject-form";

type Props = { params: Promise<{ id: string }> };

export default async function RejectPage({ params }: Props) {
  await verifyModerator();
  const { id } = await params;

  const checkin = await prisma.checkIn.findUnique({
    where: { id, status: "PENDING" },
    include: {
      user: { select: { name: true, username: true } },
      challenge: { select: { name: true } },
      target: { select: { name: true } },
    },
  });

  if (!checkin) notFound();

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto py-8 space-y-6">
      <Link href="/moderacao" className="text-sm text-muted-foreground hover:underline">← Fila</Link>
      <h1 className="text-xl font-bold">Reprovar check-in</h1>
      <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
        <Image src={checkin.photo_url} alt="Check-in" fill className="object-cover" />
      </div>
      <div className="text-sm space-y-1">
        <p><span className="text-muted-foreground">Usuário: </span>{checkin.user.name}</p>
        <p><span className="text-muted-foreground">Desafio: </span>{checkin.challenge.name}</p>
        <p><span className="text-muted-foreground">Local: </span>{checkin.target.name}</p>
      </div>
      <RejectForm checkInId={id} />
    </main>
  );
}
