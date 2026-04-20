import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import GlobalHeader from "@/components/layout/global-header";
import BottomNav from "@/components/layout/bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();

  const [user, pendingCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { username: true, role: true, name: true, avatar_url: true },
    }),
    prisma.follow.count({
      where: { following_id: session.userId, status: "PENDING" },
    }),
  ]);

  const isModerator = user?.role === "MODERATOR" || user?.role === "ADMIN";

  return (
    <div className="min-h-screen pb-20">
      <GlobalHeader
        username={user?.username ?? ""}
        avatarUrl={user?.avatar_url ?? null}
        name={user?.name ?? ""}
        pendingCount={pendingCount}
      />
      {children}
      <BottomNav username={user?.username ?? ""} isModerator={isModerator} />
    </div>
  );
}
