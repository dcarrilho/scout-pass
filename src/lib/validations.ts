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

export const ProfileSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }).trim(),
  bio: z.string().max(160, { message: "Bio deve ter no máximo 160 caracteres." }).trim().optional(),
});

export const MotorcycleSchema = z.object({
  brand: z.string().min(1, { message: "Marca é obrigatória." }).trim(),
  model: z.string().min(1, { message: "Modelo é obrigatório." }).trim(),
  year: z
    .string()
    .regex(/^\d{4}$/, { message: "Ano inválido." })
    .transform(Number)
    .refine((y) => y >= 1900 && y <= new Date().getFullYear() + 1, { message: "Ano inválido." }),
});

export type SignupFormState =
  | { errors?: { name?: string[]; username?: string[]; email?: string[]; password?: string[] }; message?: string }
  | undefined;

export type LoginFormState =
  | { errors?: { email?: string[]; password?: string[] }; message?: string }
  | undefined;

export type ProfileFormState =
  | { errors?: { name?: string[]; bio?: string[] }; message?: string; success?: boolean }
  | undefined;

export type MotorcycleFormState =
  | { errors?: { brand?: string[]; model?: string[]; year?: string[] }; message?: string; success?: boolean }
  | undefined;
