import Link from "next/link";
import Image from "next/image";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { approveCheckIn } from "@/app/actions/moderation";
import { Button } from "@/components/ui/button";

export default async function ModeracaoPage() {
  await verifyModerator();

  const pending = await prisma.checkIn.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { name: true, username: true, avatar_url: true } },
      challenge: { select: { name: true } },
      target: { select: { name: true } },
      motorcycle: { select: { brand: true, model: true, year: true } },
    },
    orderBy: { submitted_at: "asc" },
  });

  return (
    <main className="min-h-screen max-w-lg mx-auto">
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">Moderação</h1>
        {pending.length > 0 && (
          <span className="text-xs font-semibold bg-primary text-primary-foreground rounded-full px-3 py-1">
            {pending.length} pendente{pending.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="p-4 space-y-5">
        {pending.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="text-5xl">✅</span>
            <p className="font-semibold">Tudo em dia!</p>
            <p className="text-sm text-muted-foreground">Nenhum check-in aguardando revisão.</p>
          </div>
        )}

        {pending.map((checkin) => (
          <article key={checkin.id} className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            {/* User row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-muted border shrink-0 overflow-hidden flex items-center justify-center">
                {checkin.user.avatar_url ? (
                  <Image src={checkin.user.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-sm font-semibold">{checkin.user.name[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{checkin.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {checkin.target.name} · {checkin.challenge.name}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(checkin.submitted_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </span>
            </div>

            {/* Photo */}
            <div className="relative w-full aspect-[4/3] bg-muted">
              <Image src={checkin.photo_url} alt="Check-in" fill className="object-cover" />
            </div>

            {/* Meta */}
            <div className="px-4 py-3 space-y-3">
              {checkin.motorcycle && (
                <p className="text-xs text-muted-foreground">
                  🏍️ {checkin.motorcycle.brand} {checkin.motorcycle.model} {checkin.motorcycle.year}
                </p>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <form action={approveCheckIn.bind(null, checkin.id)}>
                  <Button type="submit" className="w-full">✓ Aprovar</Button>
                </form>
                <Link href={`/moderacao/${checkin.id}`} className="block">
                  <Button type="button" variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/5">
                    ✕ Reprovar
                  </Button>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
