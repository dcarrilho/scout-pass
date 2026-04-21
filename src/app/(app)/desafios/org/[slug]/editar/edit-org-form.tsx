"use client";

import { useActionState } from "react";
import { updateOrganizer } from "@/app/actions/challenges";
import { DarkField, DarkInput, DarkTextarea, DarkSubmit, FormError, DarkCoverPicker } from "@/components/ui/dark-form";

type Props = { slug: string; name: string; description?: string | null; coverUrl?: string | null };

export function EditOrgForm({ slug, name, description, coverUrl }: Props) {
  const [state, action, pending] = useActionState(updateOrganizer.bind(null, slug), undefined);

  return (
    <form action={action} className="space-y-4">
      <DarkCoverPicker currentUrl={coverUrl} />

      <DarkField label="Nome *" error={state?.errors?.name?.[0]}>
        <DarkInput name="name" defaultValue={name} />
      </DarkField>

      <DarkField label="Descrição">
        <DarkTextarea name="description" rows={3} defaultValue={description ?? ""} />
      </DarkField>

      <FormError message={state?.message} />
      <DarkSubmit pending={pending} label="Salvar alterações" />
    </form>
  );
}
