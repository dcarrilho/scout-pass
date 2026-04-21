"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { addMotorcycle, editMotorcycle, setActiveMotorcycle, deleteMotorcycle } from "@/app/actions/profile";
import { DarkInput, DarkField, DarkSubmit, FormError } from "@/components/ui/dark-form";
import { MotorcycleEditFormState } from "@/lib/validations";

type Motorcycle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string | null;
  owned_from: number | null;
  owned_until: number | null;
  is_active: boolean;
};

function formatPeriod(from: number | null, until: number | null) {
  if (from && until) return `${from} → ${until}`;
  if (from && !until) return `desde ${from} · atual`;
  return null;
}

function CurrentToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className="relative shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className="w-9 h-5 rounded-full transition-colors" style={{ background: checked ? "#f97316" : "rgba(255,255,255,0.12)" }} />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform" style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }} />
      </div>
      <span className="text-sm text-white/70">Moto atual</span>
    </label>
  );
}

function MotorcycleItem({ moto }: { moto: Motorcycle }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isCurrentMoto, setIsCurrentMoto] = useState(moto.owned_until === null && moto.owned_from !== null);
  const [state, action, pending] = useActionState<MotorcycleEditFormState, FormData>(editMotorcycle, undefined);

  useEffect(() => {
    if (state?.success) setEditing(false);
  }, [state?.success]);

  const period = formatPeriod(moto.owned_from, moto.owned_until);

  if (!editing) {
    return (
      <li className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white">{moto.brand} {moto.model}</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{moto.year}</span>
              {moto.owned_until === null && moto.owned_from !== null && (
                <span className="text-xs rounded-full px-2 py-0.5 font-medium" style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}>Atual</span>
              )}
            </div>
            {period && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{period}</p>}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)" }}
          >
            Editar
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          {!moto.is_active && (
            <form action={setActiveMotorcycle.bind(null, moto.id)}>
              <button
                type="submit"
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ color: "#f97316", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)" }}
              >
                Definir ativa
              </button>
            </form>
          )}

          {/* Confirmação de remoção */}
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "rgba(239,68,68,0.8)" }}>Tem certeza?</span>
              <form action={deleteMotorcycle.bind(null, moto.id)}>
                <button
                  type="submit"
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ color: "#fff", background: "#ef4444" }}
                >
                  Remover
                </button>
              </form>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)" }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: "rgba(239,68,68,0.6)", background: "rgba(239,68,68,0.08)" }}
            >
              Remover
            </button>
          )}
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(249,115,22,0.3)" }}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={moto.id} />
        <div className="grid grid-cols-2 gap-3">
          <DarkField label="Marca" error={state?.errors?.brand?.[0]}>
            <DarkInput id={`brand-${moto.id}`} name="brand" defaultValue={moto.brand} required />
          </DarkField>
          <DarkField label="Modelo">
            <DarkInput id={`model-${moto.id}`} name="model" defaultValue={moto.model} required />
          </DarkField>
        </div>
        <DarkField label="Ano" error={state?.errors?.year?.[0]}>
          <DarkInput id={`year-${moto.id}`} name="year" defaultValue={String(moto.year)} placeholder="2022" maxLength={4} required />
        </DarkField>
        <DarkField label="Placa" hint="Privado — não aparece no perfil público">
          <DarkInput id={`plate-${moto.id}`} name="license_plate" defaultValue={moto.license_plate ?? ""} placeholder="ABC-1234" maxLength={10} />
        </DarkField>
        <div className="grid grid-cols-2 gap-3">
          <DarkField label="Proprietário desde">
            <DarkInput id={`from-${moto.id}`} name="owned_from" defaultValue={moto.owned_from ? String(moto.owned_from) : ""} placeholder="2020" maxLength={4} />
          </DarkField>
          <DarkField label="Até">
            <DarkInput id={`until-${moto.id}`} name="owned_until" defaultValue={moto.owned_until ? String(moto.owned_until) : ""} placeholder="2023" maxLength={4} disabled={isCurrentMoto} />
          </DarkField>
        </div>
        <CurrentToggle checked={isCurrentMoto} onChange={setIsCurrentMoto} />
        <FormError message={state?.message} />
        <div className="flex gap-2 pt-1">
          <DarkSubmit pending={pending} label="Salvar" pendingLabel="Salvando..." />
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-4 py-2 rounded-xl text-sm transition-colors"
            style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)" }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </li>
  );
}

type Props = { motorcycles: Motorcycle[] };

export default function MotorcycleForm({ motorcycles }: Props) {
  const [state, action, pending] = useActionState(addMotorcycle, undefined);
  const [open, setOpen] = useState(false);
  const [isCurrentMoto, setIsCurrentMoto] = useState(true);
  const [hasFrom, setHasFrom] = useState(false);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state?.success]);

  return (
    <div className="space-y-5">
      {motorcycles.length > 0 && (
        <ul className="space-y-3">
          {motorcycles.map((moto) => <MotorcycleItem key={moto.id} moto={moto} />)}
        </ul>
      )}

      {/* Botão para abrir / form colapsável */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors"
          style={{ color: "#f97316", background: "rgba(249,115,22,0.08)", border: "1px dashed rgba(249,115,22,0.3)" }}
        >
          <Plus className="size-4" />
          Adicionar moto
        </button>
      ) : (
        <div className="rounded-xl p-4 space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(249,115,22,0.2)" }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white/60 uppercase tracking-wider">Nova moto</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs px-3 py-1 rounded-lg"
              style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)" }}
            >
              Cancelar
            </button>
          </div>
          <form action={action} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <DarkField label="Marca" error={state?.errors?.brand?.[0]}>
                <DarkInput id="brand" name="brand" placeholder="Honda" required />
              </DarkField>
              <DarkField label="Modelo">
                <DarkInput id="model" name="model" placeholder="CB 500" required />
              </DarkField>
            </div>
            <DarkField label="Ano" error={state?.errors?.year?.[0]}>
              <DarkInput id="year" name="year" placeholder="2022" maxLength={4} required />
            </DarkField>
            <DarkField label="Placa" hint="Privado — não aparece no perfil público">
              <DarkInput id="license_plate" name="license_plate" placeholder="ABC-1234" maxLength={10} />
            </DarkField>
            <div className="grid grid-cols-2 gap-3">
              <DarkField label="Proprietário desde">
                <DarkInput id="owned_from" name="owned_from" placeholder="2020" maxLength={4} onChange={(e) => setHasFrom(e.target.value.length === 4)} />
              </DarkField>
              <DarkField label="Até">
                <DarkInput id="owned_until" name="owned_until" placeholder="2023" maxLength={4} disabled={isCurrentMoto} required={!isCurrentMoto && hasFrom} />
              </DarkField>
            </div>
            <CurrentToggle checked={isCurrentMoto} onChange={setIsCurrentMoto} />
            <FormError message={state?.message} />
            <DarkSubmit pending={pending} label="Adicionar moto" pendingLabel="Adicionando..." />
          </form>
        </div>
      )}
    </div>
  );
}
