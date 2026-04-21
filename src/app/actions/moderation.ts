"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

async function authorizeModeration(checkInId: string) {
  const session = await verifySession();

  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    select: {
      user_id: true,
      challenge: {
        select: {
          moderation_mode: true,
          moderators: { select: { user_id: true } },
        },
      },
    },
  });
  if (!checkIn) redirect("/home");

  if (checkIn.challenge.moderation_mode === "PRIVATE") {
    const allowed = checkIn.challenge.moderators.some((m) => m.user_id === session.userId);
    if (!allowed) redirect("/home");
  } else {
    if (session.role !== "MODERATOR" && session.role !== "ADMIN") redirect("/home");
  }

  return { session, checkIn };
}

export async function approveCheckIn(checkInId: string) {
  const { session, checkIn } = await authorizeModeration(checkInId);

  await prisma.checkIn.update({
    where: { id: checkInId },
    data: {
      status: "APPROVED",
      reviewed_by: session.userId,
      reviewed_at: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      user_id: checkIn.user_id,
      type: "CHECKIN_APPROVED",
      checkin_id: checkInId,
    },
  });

  revalidatePath("/moderacao");
}

export async function rejectCheckIn(checkInId: string, reason: string) {
  const { session, checkIn } = await authorizeModeration(checkInId);

  await prisma.checkIn.update({
    where: { id: checkInId },
    data: {
      status: "REJECTED",
      rejection_reason: reason,
      reviewed_by: session.userId,
      reviewed_at: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      user_id: checkIn.user_id,
      type: "CHECKIN_REJECTED",
      checkin_id: checkInId,
    },
  });

  revalidatePath("/moderacao");
}
