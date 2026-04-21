"use client";

import { useActionState } from "react";
import { updateOrganizer } from "@/app/actions/challenges";

type Props = { slug: string; name: string; description?: string | null };

export function EditOrgForm({ slug, name, description }: Props) {
  const [state, action, pending] = useActionState(updateOrganizer.bind(null, slug), undefined);

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
