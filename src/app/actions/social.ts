"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export async function followUser(targetUserId: string) {
  const session = await verifySession();
  if (session.userId === targetUserId) return;

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { is_private: true, username: true },
  });
  if (!target) return;

  await prisma.follow.upsert({
    where: { follower_id_following_id: { follower_id: session.userId, following_id: targetUserId } },
    create: {
      follower_id: session.userId,
      following_id: targetUserId,
      status: target.is_private ? "PENDING" : "ACCEPTED",
    },
    update: {},
  });

  revalidatePath(`/perfil/${target.username}`);
}

export async function unfollowUser(targetUserId: string) {
  const session = await verifySession();

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { username: true },
  });

  await prisma.follow.deleteMany({
    where: { follower_id: session.userId, following_id: targetUserId },
  });

  if (target) revalidatePath(`/perfil/${target.username}`);
}

export async function acceptFollow(followId: string) {
  const session = await verifySession();

  await prisma.follow.update({
    where: { id: followId, following_id: session.userId },
    data: { status: "ACCEPTED" },
  });

  revalidatePath("/notificacoes");
}

export async function declineFollow(followId: string) {
  const session = await verifySession();

  await prisma.follow.delete({
    where: { id: followId, following_id: session.userId },
  });

  revalidatePath("/notificacoes");
}

export async function sendGarupaInvite(formData: FormData): Promise<void> {
  const session = await verifySession();
  const targetUsername = (formData.get("username") as string)?.trim().toLowerCase();

  if (!targetUsername) return;

  const target = await prisma.user.findUnique({ where: { username: targetUsername } });
  if (!target || target.id === session.userId) return;

  const existing = await prisma.pilotoGarupa.findFirst({
    where: {
      OR: [
        { piloto_id: session.userId, garupa_id: target.id },
        { piloto_id: target.id, garupa_id: session.userId },
      ],
    },
  });
  if (existing) return;

  await prisma.pilotoGarupa.create({
    data: { piloto_id: session.userId, garupa_id: target.id },
  });

  revalidatePath("/notificacoes");
  revalidatePath(`/perfil/${targetUsername}`);
}

export async function acceptGarupaLink(linkId: string) {
  const session = await verifySession();

  await prisma.pilotoGarupa.update({
    where: { id: linkId, garupa_id: session.userId },
    data: { status: "ACCEPTED" },
  });

  revalidatePath("/notificacoes");
}

export async function declineGarupaLink(linkId: string) {
  const session = await verifySession();

  await prisma.pilotoGarupa.delete({
    where: { id: linkId, garupa_id: session.userId },
  });

  revalidatePath("/notificacoes");
}

export async function removeGarupaLink(linkId: string) {
  const session = await verifySession();

  await prisma.pilotoGarupa.delete({
    where: {
      id: linkId,
      OR: [{ piloto_id: session.userId }, { garupa_id: session.userId }],
    },
  });

  revalidatePath("/notificacoes");
}

export async function markNotificationsRead(userId: string) {
  const session = await verifySession();
  if (session.userId !== userId) return;

  await prisma.notification.updateMany({
    where: { user_id: session.userId, read: false },
    data: { read: true },
  });

  revalidatePath("/notificacoes");
}
