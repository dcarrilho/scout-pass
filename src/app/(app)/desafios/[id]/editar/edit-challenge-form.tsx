"use client";

import { useActionState } from "react";
import { updateChallenge } from "@/app/actions/challenges";
import { DarkField, DarkInput, DarkTextarea, DarkSelect, DarkSubmit, FormError, DarkCoverPicker } from "@/components/ui/dark-form";

const STATES = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

type Props = { id: string; name: string; description?: string | null; state_code?: string | null; coverUrl?: string | null };

export function EditChallengeForm({ id, name, description, state_code, coverUrl }: Props) {
  const [state, action, pending] = useActionState(updateChallenge.bind(null, id), undefined);

  return (
    <form action={action} className="space-y-4">
      <DarkCoverPicker currentUrl={coverUrl} />

      <DarkField label="Nome *" error={state?.errors?.name?.[0]}>
        <DarkInput name="name" defaultValue={name} />
      </DarkField>

      <DarkField label="Estado">
        <DarkSelect name="state_code" defaultValue={state_code ?? ""}>
          <option value="">Selecione (opcional)</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </DarkSelect>
      </DarkField>

      <DarkField label="Descrição">
        <DarkTextarea name="description" rows={3} defaultValue={description ?? ""} />
      </DarkField>

      <FormError message={state?.message} />
      <DarkSubmit pending={pending} label="Salvar alterações" />
    </form>
  );
}
