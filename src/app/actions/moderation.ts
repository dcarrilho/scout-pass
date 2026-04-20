"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyModerator } from "@/lib/dal";

export async function approveCheckIn(checkInId: string) {
  const session = await verifyModerator();

  await prisma.checkIn.update({
    where: { id: checkInId },
    data: {
      status: "APPROVED",
      reviewed_by: session.userId,
      reviewed_at: new Date(),
    },
  });

  revalidatePath("/moderacao");
}

export async function rejectCheckIn(checkInId: string, reason: string) {
  const session = await verifyModerator();

  await prisma.checkIn.update({
    where: { id: checkInId },
    data: {
      status: "REJECTED",
      rejection_reason: reason,
      reviewed_by: session.userId,
      reviewed_at: new Date(),
    },
  });

  revalidatePath("/moderacao");
}
