"use client";

import { useActionState } from "react";
import { createChallenge } from "@/app/actions/challenges";
import { DarkField, DarkInput, DarkTextarea, DarkSelect, DarkSubmit, FormError } from "@/components/ui/dark-form";

const STATES = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

type Props = { seriesId: string };

export function ChallengeForm({ seriesId }: Props) {
  const [state, action, pending] = useActionState(createChallenge, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="series_id" value={seriesId} />

      <DarkField label="Nome *" error={state?.errors?.name?.[0]}>
        <DarkInput name="name" placeholder="Ex: Estrada Real" />
      </DarkField>

      <DarkField label="Estado">
        <DarkSelect name="state_code">
          <option value="">Selecione (opcional)</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </DarkSelect>
      </DarkField>

      <DarkField label="Descrição">
        <DarkTextarea name="description" rows={3} placeholder="Breve descrição do desafio..." />
      </DarkField>

      <FormError message={state?.message} />
      <DarkSubmit pending={pending} label="Criar desafio" pendingLabel="Criando..." />
    </form>
  );
}
