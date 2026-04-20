"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { uploadAvatar } from "@/lib/storage";
import {
  ProfileSchema,
  EditAccountSchema,
  MotorcycleSchema,
  MotorcycleEditSchema,
  ProfileFormState,
  EditAccountFormState,
  MotorcycleFormState,
  MotorcycleEditFormState,
} from "@/lib/validations";

export async function updateProfile(
  state: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await verifySession();

  const validated = ProfileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio") || undefined,
    is_private: formData.get("is_private") === "on",
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const avatarFile = formData.get("avatar") as File | null;
  let avatar_url: string | undefined;

  if (avatarFile && avatarFile.size > 0) {
    try {
      avatar_url = await uploadAvatar(session.userId, avatarFile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      return { message: `Erro ao enviar a foto: ${msg}` };
    }
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: validated.data.name,
      bio: validated.data.bio ?? null,
      is_private: validated.data.is_private ?? false,
      ...(avatar_url && { avatar_url }),
    },
  });

  revalidatePath("/perfil/editar");
  return { success: true };
}

export async function updateAccount(
  state: EditAccountFormState,
  formData: FormData
): Promise<EditAccountFormState> {
  const session = await verifySession();

  const validated = EditAccountSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username: validated.data.username }, { email: validated.data.email }],
      NOT: { id: session.userId },
    },
  });

  if (existing) {
    if (existing.username === validated.data.username) {
      return { errors: { username: ["Este usuário já está em uso."] } };
    }
    return { errors: { email: ["Este e-mail já está em uso."] } };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { username: validated.data.username, email: validated.data.email },
  });

  revalidatePath("/perfil/editar");
  return { success: true };
}

export async function addMotorcycle(
  state: MotorcycleFormState,
  formData: FormData
): Promise<MotorcycleFormState> {
  const session = await verifySession();

  const validated = MotorcycleSchema.safeParse({
    brand: formData.get("brand"),
    model: formData.get("model"),
    year: formData.get("year"),
    license_plate: (formData.get("license_plate") as string) || undefined,
    owned_from: (formData.get("owned_from") as string) || undefined,
    owned_until: (formData.get("owned_until") as string) || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  await prisma.motorcycle.create({
    data: {
      user_id: session.userId,
      brand: validated.data.brand,
      model: validated.data.model,
      year: validated.data.year,
      license_plate: validated.data.license_plate ?? null,
      owned_from: (validated.data.owned_from as number | undefined) ?? null,
      owned_until: (validated.data.owned_until as number | undefined) ?? null,
    },
  });

  revalidatePath("/perfil/editar");
  return { success: true };
}

export async function editMotorcycle(
  state: MotorcycleEditFormState,
  formData: FormData
): Promise<MotorcycleEditFormState> {
  const session = await verifySession();

  const validated = MotorcycleEditSchema.safeParse({
    id: formData.get("id"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    year: formData.get("year"),
    license_plate: (formData.get("license_plate") as string) || undefined,
    owned_from: (formData.get("owned_from") as string) || undefined,
    owned_until: (formData.get("owned_until") as string) || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  await prisma.motorcycle.update({
    where: { id: validated.data.id, user_id: session.userId },
    data: {
      brand: validated.data.brand,
      model: validated.data.model,
      year: validated.data.year,
      license_plate: validated.data.license_plate ?? null,
      owned_from: (validated.data.owned_from as number | undefined) ?? null,
      owned_until: (validated.data.owned_until as number | undefined) ?? null,
    },
  });

  revalidatePath("/perfil/editar");
  return { success: true };
}

export async function setActiveMotorcycle(motorcycleId: string) {
  const session = await verifySession();

  await prisma.motorcycle.updateMany({
    where: { user_id: session.userId },
    data: { is_active: false },
  });

  await prisma.motorcycle.update({
    where: { id: motorcycleId, user_id: session.userId },
    data: { is_active: true },
  });

  revalidatePath("/perfil/editar");
}

export async function deleteMotorcycle(motorcycleId: string) {
  const session = await verifySession();

  await prisma.motorcycle.delete({
    where: { id: motorcycleId, user_id: session.userId },
  });

  revalidatePath("/perfil/editar");
}
