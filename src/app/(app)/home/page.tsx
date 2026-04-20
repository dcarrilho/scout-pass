import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage() {
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, username: true },
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Olá, {user?.name?.split(" ")[0]}!</h1>
      <p className="text-muted-foreground">Em breve: desafios, check-ins e muito mais.</p>
      <div className="flex gap-2">
        <Link href="/perfil/editar" className={buttonVariants({ variant: "outline" })}>
          Meu perfil
        </Link>
        <form action={logout}>
          <Button variant="ghost" type="submit">Sair</Button>
        </form>
      </div>
    </main>
  );
}
