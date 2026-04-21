"use client";

import { useActionState } from "react";
import { createSeries } from "@/app/actions/challenges";
import { DarkField, DarkInput, DarkTextarea, DarkSubmit, FormError, DarkCoverPicker } from "@/components/ui/dark-form";

const COLORS = [
  { key: "blue",    label: "Azul",    dot: "#3b82f6" },
  { key: "amber",   label: "Âmbar",   dot: "#f59e0b" },
  { key: "purple",  label: "Roxo",    dot: "#a855f7" },
  { key: "emerald", label: "Verde",   dot: "#10b981" },
  { key: "orange",  label: "Laranja", dot: "#f97316" },
  { key: "rose",    label: "Rosa",    dot: "#f43f5e" },
  { key: "slate",   label: "Cinza",   dot: "#64748b" },
];

type Props = { organizerId: string };

export function SeriesForm({ organizerId }: Props) {
  const [state, action, pending] = useActionState(createSeries, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="organizer_id" value={organizerId} />
      <DarkCoverPicker />

      <DarkField label="Nome *" error={state?.errors?.name?.[0]}>
        <DarkInput name="name" placeholder="Ex: Série Valente" />
      </DarkField>

      <DarkField label="Ícone (emoji)">
        <DarkInput name="icon" placeholder="Ex: 🏍️" />
      </DarkField>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/75">Cor</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <label key={c.key} className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="color" value={c.key} className="sr-only peer" defaultChecked={c.key === "blue"} />
              <span
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all peer-checked:ring-2 peer-checked:ring-[#f97316]"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.dot }} />
                {c.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <DarkField label="Descrição">
        <DarkTextarea name="description" rows={3} placeholder="Breve descrição da série..." />
      </DarkField>

      <FormError message={state?.message} />
      <DarkSubmit pending={pending} label="Criar série" pendingLabel="Criando..." />
    </form>
  );
}
