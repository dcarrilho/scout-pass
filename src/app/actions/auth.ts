"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { SignupSchema, LoginSchema, SignupFormState, LoginFormState } from "@/lib/validations";

export async function signup(state: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const validated = SignupSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, username, email, password } = validated.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    if (existing.email === email) return { message: "E-mail já cadastrado." };
    return { message: "Nome de usuário já em uso." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, username, email, password: hashedPassword },
  });

  await createSession(user.id, user.role);
  redirect("/home");
}

export async function login(state: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { message: "E-mail ou senha incorretos." };
  }

  const { email, password } = validated.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { message: "E-mail ou senha incorretos." };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return { message: "E-mail ou senha incorretos." };
  }

  if (user.is_blocked) {
    return { message: "Sua conta foi suspensa. Entre em contato com o suporte." };
  }

  await createSession(user.id, user.role);
  redirect("/home");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
