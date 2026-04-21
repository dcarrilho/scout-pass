"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createChallenge } from "@/app/actions/challenges";
import { DarkField, DarkInput, DarkTextarea, DarkSelect, DarkSubmit, FormError, DarkCoverPicker } from "@/components/ui/dark-form";
import { ModeratorPicker } from "@/components/challenges/moderator-picker";

const STATES = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

type Props = { seriesId: string };

export function ChallengeForm({ seriesId }: Props) {
  const [state, action, pending] = useActionState(createChallenge, undefined);
  const [mode, setMode] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="series_id" value={seriesId} />
      <DarkCoverPicker />

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

      <DarkField label="Moderação">
        <input type="hidden" name="moderation_mode" value={mode} />
        <div className="flex gap-2">
          {(["PUBLIC", "PRIVATE"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors ${mode === m ? "ring-1 ring-orange-500" : ""}`}
              style={{
                background: mode === m ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.05)",
                color: mode === m ? "#f97316" : "rgba(255,255,255,0.5)",
                border: `1px solid ${mode === m ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <div className="font-semibold">
                {m === "PUBLIC" ? "Pública" : "Restrita"}
              </div>
              <div className="text-xs mt-0.5 opacity-70">
                {m === "PUBLIC" ? "Qualquer moderador pode aprovar" : "Apenas moderadores selecionados"}
              </div>
            </button>
          ))}
        </div>
      </DarkField>

      {mode === "PRIVATE" && (
        <DarkField label="Moderadores *" hint="Usuários que podem aprovar ou reprovar check-ins">
          <ModeratorPicker />
        </DarkField>
      )}

      <FormError message={state?.message} />
      <DarkSubmit pending={pending} label="Criar desafio" pendingLabel="Criando..." />
    </form>
  );
}
