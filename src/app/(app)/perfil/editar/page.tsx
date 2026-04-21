import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/profile/profile-form";
import AccountForm from "@/components/profile/account-form";
import MotorcycleForm from "@/components/profile/motorcycle-form";

export default async function EditarPerfilPage() {
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { motorcycles: { orderBy: { created_at: "asc" } } },
  });

  if (!user) return null;

  return (
    <main className="min-h-screen max-w-lg mx-auto">
      <div className="px-4 pt-5 pb-2">
        <Link
          href={`/perfil/${user.username}`}
          className="inline-flex items-center gap-1 text-sm text-white/45 hover:text-white/80 transition-colors"
        >
          <ChevronLeft className="size-4" />
          @{user.username}
        </Link>
      </div>

      <div className="px-4 py-4 space-y-6">
        <h1 className="text-xl font-bold text-white">Editar perfil</h1>

        <section style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Perfil</h2>
          </div>
          <div style={{ padding: "20px" }}>
            <ProfileForm name={user.name} bio={user.bio} avatarUrl={user.avatar_url} isPrivate={user.is_private} />
          </div>
        </section>

        <section style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Conta</h2>
          </div>
          <div style={{ padding: "20px" }}>
            <AccountForm username={user.username} email={user.email} />
          </div>
        </section>

        <section style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Garagem</h2>
          </div>
          <div style={{ padding: "20px" }}>
            <MotorcycleForm motorcycles={user.motorcycles} />
          </div>
        </section>
      </div>
    </main>
  );
}
