"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";
import { DarkInput, DarkTextarea, DarkField, DarkSubmit, FormError } from "@/components/ui/dark-form";

const BIO_MAX = 160;

type Props = {
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  isPrivate: boolean;
  username: string;
};

export default function ProfileForm({ name, bio, avatarUrl, coverUrl, isPrivate, username }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [privateChecked, setPrivateChecked] = useState(isPrivate);
  const [bioLen, setBioLen] = useState(bio?.length ?? 0);

  useEffect(() => {
    if (state?.success && state.username) {
      router.push(`/perfil/${state.username}`);
    }
  }, [state?.success, state?.username, router]);

  const displayAvatar = avatarPreview ?? avatarUrl;
  const displayCover = coverPreview ?? coverUrl;

  return (
    <form action={action} className="space-y-5">
      {/* Cover picker */}
      <div>
        <p className="text-sm font-medium text-white/75 mb-2">Foto de capa</p>
        <button
          type="button"
          onClick={() => coverRef.current?.click()}
          className="relative w-full h-28 rounded-xl overflow-hidden group"
          style={{ border: "1px dashed rgba(255,255,255,0.2)" }}
        >
          {displayCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayCover} alt="Capa" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{
              background: "repeating-linear-gradient(135deg, #1a1614 0 10px, #141210 10px 20px)",
            }}>
              <ImagePlus className="size-6 text-white/30" />
              <span className="text-xs text-white/40">Toque para adicionar capa</span>
            </div>
          )}
          <div
            className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <ImagePlus className="size-5 text-white" />
            <span className="text-sm text-white font-medium">Alterar capa</span>
          </div>
        </button>
        <input ref={coverRef} name="cover" type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setCoverPreview(URL.createObjectURL(f)); }} />
      </div>

      {/* Avatar + hint */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => avatarRef.current?.click()}
          className="relative w-24 h-24 rounded-full overflow-hidden shrink-0 group"
          style={{ border: "2px solid rgba(255,255,255,0.12)" }}
        >
          {displayAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
              <span className="text-3xl font-semibold text-white/60">{name[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.5)" }}>
            <Camera className="size-6 text-white" />
          </div>
        </button>
        <div>
          <p className="text-sm font-medium text-white">Foto de perfil</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {avatarPreview ? "Nova foto selecionada ✓" : "Toque para alterar"}
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>JPG, PNG ou WEBP · máx. 5 MB</p>
        </div>
        <input ref={avatarRef} name="avatar" type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setAvatarPreview(URL.createObjectURL(f)); }} />
      </div>

      <DarkField label="Nome" error={state?.errors?.name?.[0]}>
        <DarkInput id="name" name="name" defaultValue={name} required />
      </DarkField>

      {/* Bio com contador */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white/75">Bio</label>
          <span className="text-xs tabular-nums" style={{ color: bioLen > BIO_MAX * 0.9 ? "#f97316" : "rgba(255,255,255,0.3)" }}>
            {bioLen}/{BIO_MAX}
          </span>
        </div>
        <DarkTextarea
          id="bio"
          name="bio"
          defaultValue={bio ?? ""}
          maxLength={BIO_MAX}
          placeholder="Conte um pouco sobre você..."
          rows={3}
          onChange={(e) => setBioLen(e.target.value.length)}
        />
        {state?.errors?.bio?.[0] && <p className="text-xs text-red-400">{state.errors.bio[0]}</p>}
      </div>

      {/* Toggle perfil privado */}
      <label className="flex items-center gap-4 cursor-pointer select-none">
        <div className="relative shrink-0">
          <input type="checkbox" name="is_private" className="sr-only" checked={privateChecked} onChange={(e) => setPrivateChecked(e.target.checked)} />
          <div className="w-11 h-6 rounded-full transition-colors" style={{ background: privateChecked ? "#f97316" : "rgba(255,255,255,0.12)" }} />
          <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform" style={{ transform: privateChecked ? "translateX(20px)" : "translateX(0)" }} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Perfil privado</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Apenas seguidores aprovados veem seus check-ins</p>
        </div>
      </label>

      <FormError message={state?.message} />

      <DarkSubmit pending={pending} label="Salvar perfil" pendingLabel="Salvando..." />
    </form>
  );
}
