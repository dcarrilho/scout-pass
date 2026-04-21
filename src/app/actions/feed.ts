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

export async function addComment(formData: FormData): Promise<void> {
  const session = await verifySession();

  const checkInId = formData.get("checkin_id") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!checkInId || !content || content.length < 1 || content.length > 280) return;

  await prisma.comment.create({
    data: { user_id: session.userId, checkin_id: checkInId, content },
  });

  revalidatePath("/home");
}

export async function deleteComment(commentId: string) {
  const session = await verifySession();

  await prisma.comment.delete({
    where: { id: commentId, user_id: session.userId },
  });

  revalidatePath("/home");
}
