import { Suspense } from "react";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { FeedCard } from "@/components/feed/feed-card";
import { LoadMore } from "@/components/feed/load-more";

const DEFAULT_TAKE = 10;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ take?: string }>;
}) {
  const session = await verifySession();
  const { take: takeParam } = await searchParams;
  const take = Math.min(Number(takeParam) || DEFAULT_TAKE, 100);

  const rows = await prisma.checkIn.findMany({
    where: { status: "APPROVED" },
    include: {
      user: { select: { name: true, username: true, avatar_url: true } },
      challenge: { select: { name: true } },
      target: { select: { name: true } },
      reactions: { select: { id: true, user_id: true } },
      comments: {
        include: { user: { select: { id: true, name: true, username: true, avatar_url: true } } },
        orderBy: { created_at: "asc" },
      },
    },
    orderBy: { reviewed_at: "desc" },
    take: take + 1,
  });

  const hasMore = rows.length > take;
  const checkIns = hasMore ? rows.slice(0, take) : rows;

  return (
    <main className="max-w-lg mx-auto">
      <div className="py-4 px-4 space-y-5">
        {checkIns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="text-5xl">🏍️</span>
            <p className="font-semibold text-lg">Nenhuma conquista ainda</p>
            <p className="text-sm text-muted-foreground">
              Seja o primeiro a completar um check-in!
            </p>
          </div>
        ) : (
          checkIns.map((checkin) => (
            <FeedCard key={checkin.id} checkin={checkin} currentUserId={session.userId} />
          ))
        )}

        <Suspense>
          <LoadMore hasMore={hasMore} currentTake={take} />
        </Suspense>
      </div>
    </main>
  );
}
