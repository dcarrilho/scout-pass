"use client";

import { useActionState } from "react";
import { updateOrganizer } from "@/app/actions/challenges";
import { DarkField, DarkInput, DarkTextarea, DarkSubmit, FormError } from "@/components/ui/dark-form";

type Props = { slug: string; name: string; description?: string | null };

export function EditOrgForm({ slug, name, description }: Props) {
  const [state, action, pending] = useActionState(updateOrganizer.bind(null, slug), undefined);

  return (
    <form action={action} className="space-y-4">
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
