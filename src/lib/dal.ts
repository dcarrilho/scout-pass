import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    redirect("/login");
  }

  return { isAuth: true, userId: session.userId, role: session.role };
});

export const verifyModerator = cache(async () => {
  const session = await verifySession();

  if (session.role !== "MODERATOR" && session.role !== "ADMIN") {
    redirect("/home");
  }

  return session;
});

export const verifyAdmin = cache(async () => {
  const session = await verifySession();
  if (session.role !== "ADMIN") redirect("/home");
  return session;
});

export const verifyCanModerate = cache(async () => {
  const session = await verifySession();
  const isGlobalModerator = session.role === "MODERATOR" || session.role === "ADMIN";

  if (!isGlobalModerator) {
    const assigned = await prisma.challengeModerator.count({
      where: { user_id: session.userId },
    });
    if (assigned === 0) redirect("/home");
  }

  return { ...session, isGlobalModerator };
});
