import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await verifySession();

  const [user, recentCheckIns] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true },
    }),
    prisma.checkIn.findMany({
      where: { status: "APPROVED" },
      include: {
        user: { select: { name: true, username: true, avatar_url: true } },
        challenge: { select: { name: true } },
        target: { select: { name: true } },
      },
      orderBy: { reviewed_at: "desc" },
      take: 20,
    }),
  ]);

  return (
    <main className="max-w-lg mx-auto p-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">ScoutPass</h1>
        <form action={logout}>
          <Button variant="ghost" size="sm" type="submit">Sair</Button>
        </form>
      </div>

      {recentCheckIns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <span className="text-5xl">🏍️</span>
          <p className="font-medium">Nenhuma conquista ainda</p>
          <p className="text-sm text-muted-foreground">
            Seja o primeiro a completar um check-in!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentCheckIns.map((checkin) => (
            <FeedCard key={checkin.id} checkin={checkin} />
          ))}
        </div>
      )}
    </main>
  );
}

function FeedCard({ checkin }: {
  checkin: {
    id: string;
    photo_url: string;
    reviewed_at: Date | null;
    user: { name: string; username: string; avatar_url: string | null };
    challenge: { name: string };
    target: { name: string };
  };
}) {
  return (
    <article className="border rounded-xl overflow-hidden bg-card">
      <div className="flex items-center gap-3 p-3">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-medium text-sm shrink-0 overflow-hidden">
          {checkin.user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={checkin.user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            checkin.user.name[0]?.toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{checkin.user.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {checkin.challenge.name} · {checkin.target.name}
          </p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {checkin.reviewed_at
            ? new Date(checkin.reviewed_at).toLocaleDateString("pt-BR")
            : ""}
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={checkin.photo_url} alt="Check-in" className="w-full aspect-[4/3] object-cover" />
    </article>
  );
}
