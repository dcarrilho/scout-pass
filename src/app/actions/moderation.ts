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
      challenge_id: true,
      challenge: {
        select: {
          moderation_mode: true,
          moderators: { select: { user_id: true } },
          _count: { select: { targets: true } },
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

async function triggerGamificationNotifications(userId: string, challengeId: string, totalTargets: number) {
  const approvedCount = await prisma.checkIn.count({
    where: { user_id: userId, challenge_id: challengeId, status: "APPROVED" },
  });

  if (approvedCount === 1) {
    await prisma.notification.create({
      data: { user_id: userId, type: "FIRST_CHECKIN", challenge_id: challengeId },
    });
    return;
  }

  if (totalTargets === 0) return;
  const pct = Math.round((approvedCount / totalTargets) * 100);

  if (pct >= 100) {
    const exists = await prisma.notification.findFirst({
      where: { user_id: userId, type: "CHALLENGE_COMPLETED", challenge_id: challengeId },
    });
    if (!exists) {
      await prisma.notification.create({
        data: { user_id: userId, type: "CHALLENGE_COMPLETED", challenge_id: challengeId },
      });
    }
    return;
  }

  for (const milestone of [75, 50, 25]) {
    if (pct >= milestone) {
      const exists = await prisma.notification.findFirst({
        where: { user_id: userId, type: "MILESTONE", challenge_id: challengeId, metadata: String(milestone) },
      });
      if (!exists) {
        await prisma.notification.create({
          data: { user_id: userId, type: "MILESTONE", challenge_id: challengeId, metadata: String(milestone) },
        });
      }
      break;
    }
  }
}

export async function approveCheckIn(checkInId: string) {
  const { session, checkIn } = await authorizeModeration(checkInId);

  await prisma.checkIn.update({
    where: { id: checkInId },
    data: { status: "APPROVED", reviewed_by: session.userId, reviewed_at: new Date() },
  });

  await prisma.notification.create({
    data: { user_id: checkIn.user_id, type: "CHECKIN_APPROVED", checkin_id: checkInId },
  });

  await triggerGamificationNotifications(
    checkIn.user_id,
    checkIn.challenge_id,
    checkIn.challenge._count.targets
  );

  revalidatePath("/moderacao");
}

export async function rejectCheckIn(checkInId: string, reason: string) {
  const { session, checkIn } = await authorizeModeration(checkInId);

  await prisma.checkIn.update({
    where: { id: checkInId },
    data: { status: "REJECTED", rejection_reason: reason, reviewed_by: session.userId, reviewed_at: new Date() },
  });

  await prisma.notification.create({
    data: { user_id: checkIn.user_id, type: "CHECKIN_REJECTED", checkin_id: checkInId },
  });

  revalidatePath("/moderacao");
}
