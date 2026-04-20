import { z } from "zod";

export const SignupSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }).trim(),
  username: z
    .string()
    .min(3, { message: "Usuário deve ter pelo menos 3 caracteres." })
    .max(30, { message: "Usuário deve ter no máximo 30 caracteres." })
    .regex(/^[a-z0-9_]+$/, { message: "Apenas letras minúsculas, números e _." })
    .trim(),
  email: z.string().email({ message: "E-mail inválido." }).trim(),
  password: z
    .string()
    .min(8, { message: "Senha deve ter pelo menos 8 caracteres." })
    .trim(),
});

export const LoginSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().min(1).trim(),
});

export type SignupFormState =
  | { errors?: { name?: string[]; username?: string[]; email?: string[]; password?: string[] }; message?: string }
  | undefined;

export type LoginFormState =
  | { errors?: { email?: string[]; password?: string[] }; message?: string }
  | undefined;
