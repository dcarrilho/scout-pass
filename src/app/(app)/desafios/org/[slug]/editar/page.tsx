import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { verifyModerator } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { EditOrgForm } from "./edit-org-form";

type Props = { params: Promise<{ slug: string }> };

export default async function EditarOrgPage({ params }: Props) {
  await verifyModerator();
  const { slug } = await params;

  const org = await prisma.organizer.findUnique({
    where: { slug },
    select: { name: true, description: true, cover_url: true },
  });
  if (!org) notFound();

  return (
    <main className="min-h-screen max-w-2xl mx-auto">
      <div className="px-4 pt-5 pb-2">
        <Link href={`/desafios/org/${slug}`} className="inline-flex items-center gap-1 text-sm text-white/45 hover:text-white/80 transition-colors">
          <ChevronLeft className="size-4" />
          {org.name}
        </Link>
      </div>
      <div className="px-4 py-4 space-y-6">
        <h1 className="text-xl font-bold text-white">Editar organização</h1>
        <EditOrgForm slug={slug} name={org.name} description={org.description} coverUrl={org.cover_url} />
      </div>
    </main>
  );
}
