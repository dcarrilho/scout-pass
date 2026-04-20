"use client";

import { followUser, unfollowUser } from "@/app/actions/social";
import { Button } from "@/components/ui/button";

type Props = {
  targetUserId: string;
  status: "none" | "pending" | "accepted";
  isPrivate: boolean;
};

export default function FollowButton({ targetUserId, status, isPrivate }: Props) {
  if (status === "accepted") {
    return (
      <form action={unfollowUser.bind(null, targetUserId)}>
        <Button type="submit" variant="outline" size="sm">Seguindo</Button>
      </form>
    );
  }

  if (status === "pending") {
    return (
      <form action={unfollowUser.bind(null, targetUserId)}>
        <Button type="submit" variant="outline" size="sm" className="text-muted-foreground">
          Solicitado
        </Button>
      </form>
    );
  }

  return (
    <form action={followUser.bind(null, targetUserId)}>
      <Button type="submit" size="sm">
        {isPrivate ? "Solicitar seguir" : "Seguir"}
      </Button>
    </form>
  );
}
