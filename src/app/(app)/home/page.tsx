import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

export default async function HomePage() {
  const session = await verifySession();

  const [user, recentCheckIns] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, username: true, avatar_url: true },
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
    <main className="max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight">ScoutPass</span>
        <Link href={`/perfil/${user?.username}`} className="w-9 h-9 rounded-full bg-muted border overflow-hidden shrink-0 flex items-center justify-center">
          {user?.avatar_url ? (
            <Image src={user.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
          ) : (
            <span className="text-sm font-semibold">{user?.name[0]?.toUpperCase()}</span>
          )}
        </Link>
      </header>

      <div className="py-4 px-4 space-y-5">
        {recentCheckIns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="text-5xl">🏍️</span>
            <p className="font-semibold text-lg">Nenhuma conquista ainda</p>
            <p className="text-sm text-muted-foreground">Seja o primeiro a completar um check-in!</p>
          </div>
        ) : (
          recentCheckIns.map((checkin) => <FeedCard key={checkin.id} checkin={checkin} />)
        )}
      </div>
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
    <article className="rounded-2xl overflow-hidden border bg-card shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-muted border shrink-0 overflow-hidden flex items-center justify-center">
          {checkin.user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={checkin.user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold">{checkin.user.name[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">{checkin.user.name}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {checkin.target.name} · {checkin.challenge.name}
          </p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {checkin.reviewed_at
            ? new Date(checkin.reviewed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
            : ""}
        </span>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={checkin.photo_url} alt="Check-in" className="w-full aspect-[4/3] object-cover" />

      <div className="px-4 py-2.5">
        <span className="text-xs font-medium bg-muted rounded-full px-3 py-1 text-muted-foreground">
          ✅ {checkin.challenge.name}
        </span>
      </div>
    </article>
  );
}
