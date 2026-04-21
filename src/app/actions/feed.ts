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
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      select: { user_id: true },
    });

    await prisma.reaction.create({
      data: { user_id: session.userId, checkin_id: checkInId },
    });

    if (checkIn && checkIn.user_id !== session.userId) {
      await prisma.notification.create({
        data: {
          user_id: checkIn.user_id,
          actor_id: session.userId,
          type: "REACTION",
          checkin_id: checkInId,
        },
      });
    }
  }

  revalidatePath("/home");
}

export async function addComment(formData: FormData): Promise<void> {
  const session = await verifySession();

  const checkInId = formData.get("checkin_id") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!checkInId || !content || content.length < 1 || content.length > 280) return;

  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    select: { user_id: true },
  });

  await prisma.comment.create({
    data: { user_id: session.userId, checkin_id: checkInId, content },
  });

  if (checkIn && checkIn.user_id !== session.userId) {
    await prisma.notification.create({
      data: {
        user_id: checkIn.user_id,
        actor_id: session.userId,
        type: "COMMENT",
        checkin_id: checkInId,
      },
    });
  }

  revalidatePath("/home");
}

export async function deleteComment(commentId: string) {
  const session = await verifySession();

  await prisma.comment.delete({
    where: { id: commentId, user_id: session.userId },
  });

  revalidatePath("/home");
}
