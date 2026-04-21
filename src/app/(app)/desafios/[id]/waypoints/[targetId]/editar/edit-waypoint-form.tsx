"use client";

import { useActionState } from "react";
import { updateTarget } from "@/app/actions/targets";
import { DarkField, DarkInput, DarkSubmit, FormError } from "@/components/ui/dark-form";
import { CityPicker } from "@/components/challenges/city-picker";

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
  cityId?: string | null;
  cityName?: string | null;
  cityState?: string | null;
};

export function EditWaypointForm({ targetId, challengeId, name, type, order, latitude, longitude, cityId, cityName, cityState }: Props) {
  const [state, action, pending] = useActionState(
    updateTarget.bind(null, targetId, challengeId),
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <DarkField label="Nome *" error={state?.errors?.name?.[0]}>
        <DarkInput name="name" defaultValue={name} />
      </DarkField>

      <CityPicker
        currentCityId={cityId}
        currentCityName={cityName}
        currentState={cityState}
      />

      <DarkField label="Tipo">
        <div className="flex flex-wrap gap-2">
          {TARGET_TYPES.map((t) => (
            <label key={t.value} className="cursor-pointer">
              <input type="radio" name="type" value={t.value} defaultChecked={type === t.value} className="sr-only peer" />
              <span
                className="inline-block px-3 py-1.5 rounded-full text-sm font-medium transition-colors peer-checked:bg-orange-500 peer-checked:text-white"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}
              >
                {t.label}
              </span>
            </label>
          ))}
        </div>
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
