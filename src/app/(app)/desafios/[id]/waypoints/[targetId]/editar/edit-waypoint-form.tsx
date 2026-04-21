"use client";

import { useActionState } from "react";
import { updateTarget } from "@/app/actions/targets";
import { DarkField, DarkInput, DarkSelect, DarkSubmit, FormError } from "@/components/ui/dark-form";

const TARGET_TYPES = [
  { value: "CITY", label: "Cidade" },
  { value: "WAYPOINT", label: "Waypoint" },
  { value: "LANDMARK", label: "Ponto turístico" },
  { value: "BORDER", label: "Divisa" },
];

type Props = {
  targetId: string;
  challengeId: string;
  name: string;
  type: string;
  order: number;
  latitude?: number | null;
  longitude?: number | null;
};

export function EditWaypointForm({ targetId, challengeId, name, type, order, latitude, longitude }: Props) {
  const [state, action, pending] = useActionState(
    updateTarget.bind(null, targetId, challengeId),
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <DarkField label="Nome *" error={state?.errors?.name?.[0]}>
        <DarkInput name="name" defaultValue={name} />
      </DarkField>

      <DarkField label="Tipo">
        <DarkSelect name="type" defaultValue={type}>
          {TARGET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </DarkSelect>
      </DarkField>

      <DarkField label="Ordem" hint="Número para ordenação na lista">
        <DarkInput name="order" type="number" defaultValue={String(order)} />
      </DarkField>

      <div className="grid grid-cols-2 gap-3">
        <DarkField label="Latitude" error={state?.errors?.latitude?.[0]}>
          <DarkInput name="latitude" type="number" step="any" placeholder="-15.7801" defaultValue={latitude != null ? String(latitude) : ""} />
        </DarkField>
        <DarkField label="Longitude" error={state?.errors?.longitude?.[0]}>
          <DarkInput name="longitude" type="number" step="any" placeholder="-47.9292" defaultValue={longitude != null ? String(longitude) : ""} />
        </DarkField>
      </div>

      <FormError message={state?.message} />
      <DarkSubmit pending={pending} label="Salvar alterações" />
    </form>
  );
}
