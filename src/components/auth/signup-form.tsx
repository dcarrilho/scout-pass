"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Junte-se à comunidade ScoutPass</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">
          {state?.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" name="name" placeholder="Seu nome" required />
            {state?.errors?.name && (
              <p className="text-xs text-destructive">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Nome de usuário</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input id="username" name="username" placeholder="seu_usuario" className="pl-7" required />
            </div>
            {state?.errors?.username && (
              <p className="text-xs text-destructive">{state.errors.username[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
            {state?.errors?.email && (
              <p className="text-xs text-destructive">{state.errors.email[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" placeholder="Mín. 8 caracteres" required />
            {state?.errors?.password && (
              <p className="text-xs text-destructive">{state.errors.password[0]}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Criando conta..." : "Criar conta"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Já tem conta?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Entre aqui
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
