"use client";

import { useActionState } from "react";
import { createOrganizer } from "@/app/actions/challenges";
import { DarkField, DarkInput, DarkTextarea, DarkSubmit, FormError } from "@/components/ui/dark-form";

export function OrgForm() {
  const [state, action, pending] = useActionState(createOrganizer, undefined);

  return (
    <form action={action} className="space-y-4">
      <DarkField label="Nome *" error={state?.errors?.name?.[0]}>
        <DarkInput name="name" placeholder="Ex: Moto Clube Paulista" />
      </DarkField>

      <DarkField label="Descrição">
        <DarkTextarea name="description" rows={3} placeholder="Breve descrição da organização..." />
      </DarkField>

      <FormError message={state?.message} />
      <DarkSubmit pending={pending} label="Criar organização" pendingLabel="Criando..." />
    </form>
  );
}
