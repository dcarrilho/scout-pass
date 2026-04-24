"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/dal";

export async function updateUserRole(userId: string, role: string) {
  await verifyAdmin();

  if (!["USER", "MODERATOR", "ADMIN"].includes(role)) return;

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as "USER" | "MODERATOR" | "ADMIN" },
  });

  revalidatePath("/admin/usuarios");
}

export async function toggleChallengeActive(challengeId: string, isActive: boolean) {
  await verifyAdmin();

  await prisma.challenge.update({
    where: { id: challengeId },
    data: { is_active: isActive },
  });

  revalidatePath("/admin/desafios");
}
