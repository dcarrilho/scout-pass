"use client";

import { useActionState } from "react";
import { updateSeries } from "@/app/actions/challenges";
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

type Props = { id: string; name: string; description?: string | null; icon?: string | null; color?: string | null; coverUrl?: string | null };

export function EditSeriesForm({ id, name, description, icon, color, coverUrl }: Props) {
  const [state, action, pending] = useActionState(updateSeries.bind(null, id), undefined);

  return (
    <form action={action} className="space-y-4">
      <DarkCoverPicker currentUrl={coverUrl} />

      <DarkField label="Nome *" error={state?.errors?.name?.[0]}>
        <DarkInput name="name" defaultValue={name} />
      </DarkField>

      <DarkField label="Ícone (emoji)">
        <DarkInput name="icon" defaultValue={icon ?? ""} placeholder="Ex: 🏍️" />
      </DarkField>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/75">Cor</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <label key={c.key} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c.key}
                className="sr-only peer"
                defaultChecked={color === c.key || (!color && c.key === "blue")}
              />
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
        <DarkTextarea name="description" rows={3} defaultValue={description ?? ""} />
      </DarkField>

      <FormError message={state?.message} />
      <DarkSubmit pending={pending} label="Salvar alterações" />
    </form>
  );
}
