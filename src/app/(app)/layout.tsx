import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import BottomNav from "@/components/layout/bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { username: true, role: true },
  });

  const isModerator = user?.role === "MODERATOR" || user?.role === "ADMIN";

  return (
    <div className="min-h-screen pb-20">
      {children}
      <BottomNav username={user?.username ?? ""} isModerator={isModerator} />
    </div>
  );
}
