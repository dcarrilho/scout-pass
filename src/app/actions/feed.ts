"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export async function toggleReaction(checkInId: string) {
  const session = await verifySession();

  const existing = await prisma.reaction.findUnique({
    where: { user_id_checkin_id: { user_id: session.userId, checkin_id: checkInId } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({
      data: { user_id: session.userId, checkin_id: checkInId },
    });
  }

  revalidatePath("/home");
}

export async function addComment(
  _: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await verifySession();

  const checkInId = formData.get("checkin_id") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!checkInId) return { error: "Check-in inválido." };
  if (!content || content.length < 1) return { error: "Comentário não pode ser vazio." };
  if (content.length > 280) return { error: "Máximo de 280 caracteres." };

  await prisma.comment.create({
    data: { user_id: session.userId, checkin_id: checkInId, content },
  });

  revalidatePath("/home");
  return {};
}

export async function deleteComment(commentId: string) {
  const session = await verifySession();

  await prisma.comment.delete({
    where: { id: commentId, user_id: session.userId },
  });

  revalidatePath("/home");
}
