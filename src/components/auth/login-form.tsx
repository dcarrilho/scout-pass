"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta ScoutPass</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">
          {state?.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Não tem conta?{" "}
            <Link href="/cadastro" className="underline underline-offset-4 hover:text-primary">
              Cadastre-se
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
