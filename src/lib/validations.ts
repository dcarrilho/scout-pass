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
  is_private: z.boolean().optional(),
});

export const EditAccountSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Usuário deve ter pelo menos 3 caracteres." })
    .max(30, { message: "Usuário deve ter no máximo 30 caracteres." })
    .regex(/^[a-z0-9_]+$/, { message: "Apenas letras minúsculas, números e _." })
    .trim(),
  email: z.string().email({ message: "E-mail inválido." }).trim(),
});

const yearField = (label: string) =>
  z
    .string()
    .regex(/^\d{4}$/, { message: `${label} inválido (ex: 2020).` })
    .transform(Number)
    .refine((y) => y >= 1900 && y <= new Date().getFullYear() + 1, { message: `${label} inválido.` });

const optionalYearField = () =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z
      .string()
      .regex(/^\d{4}$/, { message: "Ano inválido (ex: 2020)." })
      .transform(Number)
      .refine((y) => y >= 1900 && y <= new Date().getFullYear() + 1, { message: "Ano inválido." })
      .optional()
  );

export const MotorcycleSchema = z.object({
  brand: z.string().min(1, { message: "Marca é obrigatória." }).trim(),
  model: z.string().min(1, { message: "Modelo é obrigatório." }).trim(),
  year: yearField("Ano"),
  license_plate: z.string().max(10).trim().optional(),
  owned_from: optionalYearField(),
  owned_until: optionalYearField(),
});

export const MotorcycleEditSchema = z.object({
  id: z.string().min(1),
  brand: z.string().min(1, { message: "Marca é obrigatória." }).trim(),
  model: z.string().min(1, { message: "Modelo é obrigatório." }).trim(),
  year: yearField("Ano"),
  license_plate: z.string().max(10).trim().optional(),
  owned_from: optionalYearField(),
  owned_until: optionalYearField(),
});

export type SignupFormState =
  | { errors?: { name?: string[]; username?: string[]; email?: string[]; password?: string[] }; message?: string }
  | undefined;

export type LoginFormState =
  | { errors?: { email?: string[]; password?: string[] }; message?: string }
  | undefined;

export type ProfileFormState =
  | { errors?: { name?: string[]; bio?: string[] }; message?: string; success?: boolean; username?: string }
  | undefined;

export type EditAccountFormState =
  | { errors?: { username?: string[]; email?: string[] }; message?: string; success?: boolean; newUsername?: string }
  | undefined;

export type MotorcycleFormState =
  | { errors?: { brand?: string[]; model?: string[]; year?: string[] }; message?: string; success?: boolean }
  | undefined;

export type MotorcycleEditFormState =
  | { errors?: { brand?: string[]; model?: string[]; year?: string[]; license_plate?: string[] }; message?: string; success?: boolean }
  | undefined;

export const EditProfileFullSchema = ProfileSchema.merge(EditAccountSchema);

export type EditProfileFullFormState =
  | {
      errors?: { name?: string[]; bio?: string[]; username?: string[]; email?: string[] };
      message?: string;
      success?: boolean;
      username?: string;
    }
  | undefined;

export const ChangePasswordSchema = z
  .object({
    current_password: z.string().min(1, { message: "Informe a senha atual." }),
    new_password: z.string().min(8, { message: "Nova senha deve ter pelo menos 8 caracteres." }),
    confirm_password: z.string().min(1, { message: "Confirme a nova senha." }),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "As senhas não coincidem.",
    path: ["confirm_password"],
  });

export type ChangePasswordFormState =
  | { errors?: { current_password?: string[]; new_password?: string[]; confirm_password?: string[] }; message?: string; success?: boolean }
  | undefined;
