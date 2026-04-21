import Link from "next/link";
import { verifyModerator } from "@/lib/dal";
import { OrgForm } from "./org-form";

export default async function NovaOrganizacaoPage() {
  await verifyModerator();

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="px-4 pt-6 pb-2">
        <Link href="/desafios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Desafios
        </Link>
      </div>

      <div className="px-4 py-4 space-y-6">
        <h1 className="text-xl font-bold">Nova organização</h1>
        <OrgForm />
      </div>
    </main>
  );
}
