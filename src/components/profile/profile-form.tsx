"use client";

import { useActionState, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";
import { DarkInput, DarkTextarea, DarkField, DarkSubmit, FormError } from "@/components/ui/dark-form";

type Props = {
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
};

export default function ProfileForm({ name, bio, avatarUrl, isPrivate }: Props) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [privateChecked, setPrivateChecked] = useState(isPrivate);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  const displayUrl = preview ?? avatarUrl;

  return (
    <form action={action} className="space-y-5">
      {/* Avatar clicável */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-24 h-24 rounded-full overflow-hidden shrink-0 group"
          style={{ border: "2px solid rgba(255,255,255,0.12)" }}
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
              <span className="text-3xl font-semibold text-white/60">{name[0]?.toUpperCase()}</span>
            </div>
          )}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <Camera className="size-6 text-white" />
          </div>
        </button>
        <div>
          <p className="text-sm font-medium text-white">Foto de perfil</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {preview ? "Nova foto selecionada ✓" : "Toque para alterar"}
          </p>
        </div>
        <input ref={fileRef} name="avatar" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <DarkField label="Nome" error={state?.errors?.name?.[0]}>
        <DarkInput id="name" name="name" defaultValue={name} required />
      </DarkField>

      <DarkField label="Bio" error={state?.errors?.bio?.[0]}>
        <DarkTextarea id="bio" name="bio" defaultValue={bio ?? ""} maxLength={160} placeholder="Conte um pouco sobre você..." rows={3} />
      </DarkField>

      {/* Toggle perfil privado */}
      <label className="flex items-center gap-4 cursor-pointer select-none">
        <div className="relative shrink-0">
          <input
            type="checkbox"
            name="is_private"
            className="sr-only peer"
            checked={privateChecked}
            onChange={(e) => setPrivateChecked(e.target.checked)}
          />
          <div
            className="w-11 h-6 rounded-full transition-colors"
            style={{ background: privateChecked ? "#f97316" : "rgba(255,255,255,0.12)" }}
          />
          <div
            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
            style={{ transform: privateChecked ? "translateX(20px)" : "translateX(0)" }}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Perfil privado</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Apenas seguidores aprovados veem seus check-ins</p>
        </div>
      </label>

      <FormError message={state?.message} />
      {state?.success && (
        <p className="text-sm font-medium" style={{ color: "#16a34a" }}>Perfil atualizado!</p>
      )}

      <DarkSubmit pending={pending} label="Salvar perfil" pendingLabel="Salvando..." />
    </form>
  );
}
