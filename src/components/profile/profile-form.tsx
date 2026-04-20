"use client";

import { useActionState, useRef } from "react";
import Image from "next/image";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  name: string;
  bio: string | null;
  avatarUrl: string | null;
};

export default function ProfileForm({ name, bio, avatarUrl }: Props) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground">
              {name[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            Alterar foto
          </Button>
          <input ref={fileRef} name="avatar" type="file" accept="image/*" className="hidden" />
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

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
      {state?.success && <p className="text-sm text-green-600">Perfil atualizado!</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar perfil"}
      </Button>
    </form>
  );
}
