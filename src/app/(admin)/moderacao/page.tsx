import Link from "next/link";
import Image from "next/image";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { approveCheckIn, rejectCheckIn } from "@/app/actions/moderation";
import { Button } from "@/components/ui/button";

export default async function ModeracaoPage() {
  await verifyModerator();

  const pending = await prisma.checkIn.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { name: true, username: true } },
      challenge: { select: { name: true } },
      target: { select: { name: true } },
      motorcycle: { select: { brand: true, model: true, year: true } },
    },
    orderBy: { submitted_at: "asc" },
  });

  return (
    <main className="min-h-screen p-4 max-w-3xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Moderação</h1>
        <span className="text-sm text-muted-foreground">{pending.length} pendente(s)</span>
      </div>

      {pending.length === 0 && (
        <p className="text-muted-foreground text-center py-12">Nenhum check-in pendente.</p>
      )}

      <div className="space-y-4">
        {pending.map((checkin) => (
          <div key={checkin.id} className="border rounded-lg overflow-hidden">
            <div className="relative w-full h-64 bg-muted">
              <Image src={checkin.photo_url} alt="Check-in" fill className="object-cover" />
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Usuário: </span>{checkin.user.name} (@{checkin.user.username})</div>
                <div><span className="text-muted-foreground">Desafio: </span>{checkin.challenge.name}</div>
                <div><span className="text-muted-foreground">Local: </span>{checkin.target.name}</div>
                {checkin.motorcycle && (
                  <div><span className="text-muted-foreground">Moto: </span>{checkin.motorcycle.brand} {checkin.motorcycle.model} {checkin.motorcycle.year}</div>
                )}
                <div><span className="text-muted-foreground">Enviado: </span>{new Date(checkin.submitted_at).toLocaleString("pt-BR")}</div>
              </div>

              <div className="flex gap-2 pt-2">
                <form action={approveCheckIn.bind(null, checkin.id)} className="flex-1">
                  <Button type="submit" className="w-full">Aprovar</Button>
                </form>
                <Link href={`/moderacao/${checkin.id}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full">Reprovar</Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
