"use client";

import { followUser, unfollowUser } from "@/app/actions/social";

type Props = {
  targetUserId: string;
  status: "none" | "pending" | "accepted";
  isPrivate: boolean;
  className?: string;
};

export default function FollowButton({ targetUserId, status, isPrivate, className }: Props) {
  const base =
    "w-full h-10 rounded-xl text-sm font-semibold transition-colors " + (className ?? "");

  if (status === "accepted") {
    return (
      <form action={unfollowUser.bind(null, targetUserId)}>
        <button
          type="submit"
          className={base}
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          Seguindo
        </button>
      </form>
    );
  }

  if (status === "pending") {
    return (
      <form action={unfollowUser.bind(null, targetUserId)}>
        <button
          type="submit"
          className={base}
          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          Solicitado
        </button>
      </form>
    );
  }

  return (
    <form action={followUser.bind(null, targetUserId)}>
      <button
        type="submit"
        className={base}
        style={{ background: "#f97316", color: "#0c0a09" }}
      >
        {isPrivate ? "Solicitar seguir" : "Seguir"}
      </button>
    </form>
  );
}
