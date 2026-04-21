"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { uploadAvatar, uploadCover } from "@/lib/storage";
import bcrypt from "bcryptjs";
import {
  ProfileSchema,
  EditAccountSchema,
  EditProfileFullSchema,
  MotorcycleSchema,
  MotorcycleEditSchema,
  ChangePasswordSchema,
  ProfileFormState,
  EditAccountFormState,
  EditProfileFullFormState,
  MotorcycleFormState,
  MotorcycleEditFormState,
  ChangePasswordFormState,
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
  const coverFile = formData.get("cover") as File | null;
  let avatar_url: string | undefined;
  let cover_url: string | undefined;

  if (avatarFile && avatarFile.size > 0) {
    try {
      avatar_url = await uploadAvatar(session.userId, avatarFile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      return { message: `Erro ao enviar o avatar: ${msg}` };
    }
  }

  if (coverFile && coverFile.size > 0) {
    try {
      cover_url = await uploadCover(session.userId, coverFile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      return { message: `Erro ao enviar a capa: ${msg}` };
    }
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: validated.data.name,
      bio: validated.data.bio ?? null,
      is_private: validated.data.is_private,
      ...(avatar_url && { avatar_url }),
      ...(cover_url && { cover_url }),
    },
    select: { username: true },
  });

  revalidatePath(`/perfil/${user.username}`);
  return { success: true, username: user.username };
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

  revalidatePath(`/perfil/${validated.data.username}`);
  return { success: true, newUsername: validated.data.username };
}

export async function updateProfileFull(
  state: EditProfileFullFormState,
  formData: FormData
): Promise<EditProfileFullFormState> {
  const session = await verifySession();

  const validated = EditProfileFullSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio") || undefined,
    is_private: formData.get("is_private") === "on",
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

  const avatarFile = formData.get("avatar") as File | null;
  const coverFile = formData.get("cover") as File | null;
  let avatar_url: string | undefined;
  let cover_url: string | undefined;

  if (avatarFile && avatarFile.size > 0) {
    try {
      avatar_url = await uploadAvatar(session.userId, avatarFile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      return { message: `Erro ao enviar o avatar: ${msg}` };
    }
  }

  if (coverFile && coverFile.size > 0) {
    try {
      cover_url = await uploadCover(session.userId, coverFile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      return { message: `Erro ao enviar a capa: ${msg}` };
    }
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: validated.data.name,
      bio: validated.data.bio ?? null,
      is_private: validated.data.is_private,
      username: validated.data.username,
      email: validated.data.email,
      ...(avatar_url && { avatar_url }),
      ...(cover_url && { cover_url }),
    },
  });

  revalidatePath(`/perfil/${validated.data.username}`);
  return { success: true, username: validated.data.username };
}

export async function changePassword(
  state: ChangePasswordFormState,
  formData: FormData
): Promise<ChangePasswordFormState> {
  const session = await verifySession();

  const validated = ChangePasswordSchema.safeParse({
    current_password: formData.get("current_password"),
    new_password: formData.get("new_password"),
    confirm_password: formData.get("confirm_password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { password: true } });
  if (!user) return { message: "Usuário não encontrado." };

  const valid = await bcrypt.compare(validated.data.current_password, user.password);
  if (!valid) return { errors: { current_password: ["Senha atual incorreta."] } };

  const hashed = await bcrypt.hash(validated.data.new_password, 12);
  await prisma.user.update({ where: { id: session.userId }, data: { password: hashed } });

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
