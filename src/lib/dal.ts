import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/session";

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
