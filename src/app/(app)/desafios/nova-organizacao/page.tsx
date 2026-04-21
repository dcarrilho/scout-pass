import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { verifyModerator } from "@/lib/dal";
import { OrgForm } from "./org-form";

export default async function NovaOrganizacaoPage() {
  await verifyModerator();

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <FormShell back="/desafios" backLabel="Desafios" title="Nova organização">
        <OrgForm />
      </FormShell>
    </main>
  );
}

function FormShell({ back, backLabel, title, children }: { back: string; backLabel: string; title: string; children: React.ReactNode }) {
  return (
    <>
      <div className="px-4 pt-5 pb-2">
        <Link href={back} className="inline-flex items-center gap-1 text-sm text-white/45 hover:text-white/80 transition-colors">
          <ChevronLeft className="size-4" />
          {backLabel}
        </Link>
      </div>
      <div className="px-4 py-4 space-y-6">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {children}
      </div>
    </>
  );
}
