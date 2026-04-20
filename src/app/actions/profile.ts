"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { uploadAvatar } from "@/lib/storage";
import { ProfileSchema, MotorcycleSchema, ProfileFormState, MotorcycleFormState } from "@/lib/validations";

export async function updateProfile(
  state: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await verifySession();

  const validated = ProfileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const avatarFile = formData.get("avatar") as File | null;
  let avatar_url: string | undefined;

  if (avatarFile && avatarFile.size > 0) {
    try {
      avatar_url = await uploadAvatar(session.userId, avatarFile);
    } catch {
      return { message: "Erro ao enviar a foto. Tente novamente." };
    }
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: validated.data.name,
      bio: validated.data.bio ?? null,
      ...(avatar_url && { avatar_url }),
    },
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
