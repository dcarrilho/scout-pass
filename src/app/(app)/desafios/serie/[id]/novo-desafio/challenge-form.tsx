"use client";

import { useActionState } from "react";
import { createChallenge } from "@/app/actions/challenges";

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

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nome *</label>
        <input
          name="name"
          placeholder="Ex: Estrada Real"
          className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        />
        {state?.errors?.name && (
          <p className="text-xs text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Estado</label>
        <select
          name="state_code"
          className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Selecione (opcional)</option>
          {STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Descrição</label>
        <textarea
          name="description"
          rows={3}
          placeholder="Breve descrição do desafio..."
          className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      {state?.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold disabled:opacity-60 transition-opacity"
      >
        {pending ? "Criando..." : "Criar desafio"}
      </button>
    </form>
  );
}
