import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import ProfileForm from "@/components/profile/profile-form";
import MotorcycleForm from "@/components/profile/motorcycle-form";

export default async function EditarPerfilPage() {
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { motorcycles: { orderBy: { created_at: "asc" } } },
  });

  if (!user) return null;

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Editar perfil</h1>
        <Link href={`/perfil/${user.username}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Ver perfil
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            name={user.name}
            bio={user.bio}
            avatarUrl={user.avatar_url}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Garagem</CardTitle>
        </CardHeader>
        <CardContent>
          <MotorcycleForm motorcycles={user.motorcycles} />
        </CardContent>
      </Card>
    </main>
  );
}
