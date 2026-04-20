"use client";

import { useActionState, useRef, useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  const displayUrl = preview ?? avatarUrl;

  return (
    <form action={action} encType="multipart/form-data" className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-semibold text-muted-foreground">{name[0]?.toUpperCase()}</span>
          )}
        </div>
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            {preview ? "Foto selecionada ✓" : "Alterar foto"}
          </Button>
          <input ref={fileRef} name="avatar" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={name} required />
        {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={bio ?? ""} maxLength={160} placeholder="Conte um pouco sobre você..." rows={3} />
        {state?.errors?.bio && <p className="text-xs text-destructive">{state.errors.bio[0]}</p>}
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative">
          <input type="checkbox" name="is_private" className="sr-only peer" defaultChecked={isPrivate} />
          <div className="w-10 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors" />
          <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
        </div>
        <div>
          <p className="text-sm font-medium">Perfil privado</p>
          <p className="text-xs text-muted-foreground">Apenas seguidores aprovados veem seus check-ins</p>
        </div>
      </label>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
      {state?.success && <p className="text-sm text-green-600">Perfil atualizado!</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar perfil"}
      </Button>
    </form>
  );
}
