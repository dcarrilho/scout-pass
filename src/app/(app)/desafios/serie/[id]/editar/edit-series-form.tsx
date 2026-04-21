"use client";

import { useActionState } from "react";
import { updateSeries } from "@/app/actions/challenges";

const COLORS = [
  { key: "blue",    label: "Azul",     dot: "bg-blue-500" },
  { key: "amber",   label: "Âmbar",    dot: "bg-amber-500" },
  { key: "purple",  label: "Roxo",     dot: "bg-purple-500" },
  { key: "emerald", label: "Verde",    dot: "bg-emerald-500" },
  { key: "orange",  label: "Laranja",  dot: "bg-orange-500" },
  { key: "rose",    label: "Rosa",     dot: "bg-rose-500" },
  { key: "slate",   label: "Cinza",    dot: "bg-slate-500" },
];

type Props = {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
};

export function EditSeriesForm({ id, name, description, icon, color }: Props) {
  const [state, action, pending] = useActionState(updateSeries.bind(null, id), undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nome *</label>
        <input
          name="name"
          defaultValue={name}
          className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        />
        {state?.errors?.name && (
          <p className="text-xs text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Ícone (emoji)</label>
        <input
          name="icon"
          defaultValue={icon ?? ""}
          placeholder="Ex: 🏍️"
          className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Cor</label>
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
              <span className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium peer-checked:border-primary peer-checked:bg-primary/10 transition-colors">
                <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                {c.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Descrição</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={description ?? ""}
          className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold disabled:opacity-60 transition-opacity"
      >
        {pending ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
