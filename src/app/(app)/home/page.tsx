import { verifySession } from "@/lib/dal";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  await verifySession();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Bem-vindo ao ScoutPass</h1>
      <p className="text-muted-foreground">Em breve: desafios, check-ins e muito mais.</p>
      <form action={logout}>
        <Button variant="outline" type="submit">Sair</Button>
      </form>
    </main>
  );
}
