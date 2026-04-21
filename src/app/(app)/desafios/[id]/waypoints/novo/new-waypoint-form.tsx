"use client";

import { useActionState } from "react";
import { createTarget } from "@/app/actions/targets";
import { DarkField, DarkInput, DarkSelect, DarkSubmit, FormError } from "@/components/ui/dark-form";
import { CityPicker } from "@/components/challenges/city-picker";

const TARGET_TYPES = [
  { value: "CITY", label: "Cidade" },
  { value: "WAYPOINT", label: "Waypoint" },
  { value: "LANDMARK", label: "Ponto turístico" },
  { value: "BORDER", label: "Divisa" },
];

export function NewWaypointForm({ challengeId }: { challengeId: string }) {
  const [state, action, pending] = useActionState(
    createTarget.bind(null, challengeId),
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <DarkField label="Nome *" error={state?.errors?.name?.[0]}>
        <DarkInput name="name" placeholder="Ex: Tiradentes" autoFocus />
      </DarkField>

      <DarkField label="Tipo">
        <DarkSelect name="type" defaultValue="CITY">
          {TARGET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </DarkSelect>
      </DarkField>

      <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-xs font-semibold text-white/35 uppercase tracking-widest">Município</p>
        <CityPicker />
      </div>

      <DarkField label="Ordem" hint="Número para ordenação na lista">
        <DarkInput name="order" type="number" defaultValue="0" />
      </DarkField>

      <div className="grid grid-cols-2 gap-3">
        <DarkField label="Latitude" error={state?.errors?.latitude?.[0]}>
          <DarkInput name="latitude" type="number" step="any" placeholder="-15.7801" />
        </DarkField>
        <DarkField label="Longitude" error={state?.errors?.longitude?.[0]}>
          <DarkInput name="longitude" type="number" step="any" placeholder="-47.9292" />
        </DarkField>
      </div>

      <FormError message={state?.message} />
      <DarkSubmit pending={pending} label="Criar waypoint" />
    </form>
  );
}
