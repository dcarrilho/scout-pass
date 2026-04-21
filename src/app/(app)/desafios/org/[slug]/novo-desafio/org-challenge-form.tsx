"use client";

import { useActionState } from "react";
import { createOrgChallenge } from "@/app/actions/challenges";
import { DarkField, DarkInput, DarkTextarea, DarkSelect, DarkSubmit, FormError } from "@/components/ui/dark-form";

const STATES = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

type Props = { orgSlug: string };

export function OrgChallengeForm({ orgSlug }: Props) {
  const [state, action, pending] = useActionState(createOrgChallenge.bind(null, orgSlug), undefined);

  return (
    <form action={action} className="space-y-4">
      <DarkField label="Nome *" error={state?.errors?.name?.[0]}>
        <DarkInput name="name" placeholder="Ex: Chapada dos Veadeiros" />
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
