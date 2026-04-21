import { describe, it, expect, vi } from "vitest";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    follow: { upsert: vi.fn(), deleteMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
    pilotoGarupa: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    notification: { updateMany: vi.fn() },
  },
}));
vi.mock("@/lib/dal", () => ({
  verifySession: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import {
  followUser, unfollowUser, acceptFollow, declineFollow,
  sendGarupaInvite, acceptGarupaLink, declineGarupaLink, removeGarupaLink, markNotificationsRead,
} from "@/app/actions/social";

const mockVerify = vi.mocked(verifySession);
const mockUserFind = vi.mocked(prisma.user.findUnique);
const mockFollowUpsert = vi.mocked(prisma.follow.upsert);
const mockFollowDeleteMany = vi.mocked(prisma.follow.deleteMany);
const mockFollowUpdate = vi.mocked(prisma.follow.update);
const mockFollowDelete = vi.mocked(prisma.follow.delete);
const mockGarupaFind = vi.mocked(prisma.pilotoGarupa.findFirst);
const mockGarupaCreate = vi.mocked(prisma.pilotoGarupa.create);
const mockGarupaUpdate = vi.mocked(prisma.pilotoGarupa.update);
const mockGarupaDelete = vi.mocked(prisma.pilotoGarupa.delete);
const mockNotificationUpdateMany = vi.mocked(prisma.notification.updateMany);
const mockRevalidate = vi.mocked(revalidatePath);

const session = { isAuth: true, userId: "u1", role: "USER" };

describe("followUser", () => {
  it("does nothing when following self", async () => {
    mockVerify.mockResolvedValue(session);
    await followUser("u1");
    expect(mockUserFind).not.toHaveBeenCalled();
  });

  it("does nothing when target not found", async () => {
    mockVerify.mockResolvedValue(session);
    mockUserFind.mockResolvedValue(null);
    await followUser("u2");
    expect(mockFollowUpsert).not.toHaveBeenCalled();
  });

  it("creates follow with ACCEPTED for public user", async () => {
    mockVerify.mockResolvedValue(session);
    mockUserFind.mockResolvedValue({ is_private: false, username: "target" } as any);
    mockFollowUpsert.mockResolvedValue({} as any);
    await followUser("u2");
    expect(mockFollowUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ status: "ACCEPTED" }) })
    );
    expect(mockRevalidate).toHaveBeenCalledWith("/perfil/target");
  });

  it("creates follow with PENDING for private user", async () => {
    mockVerify.mockResolvedValue(session);
    mockUserFind.mockResolvedValue({ is_private: true, username: "priv" } as any);
    mockFollowUpsert.mockResolvedValue({} as any);
    await followUser("u2");
    expect(mockFollowUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ status: "PENDING" }) })
    );
  });
});

describe("unfollowUser", () => {
  it("deletes follow and revalidates when target found", async () => {
    mockVerify.mockResolvedValue(session);
    mockUserFind.mockResolvedValue({ username: "target" } as any);
    mockFollowDeleteMany.mockResolvedValue({ count: 1 });
    await unfollowUser("u2");
    expect(mockFollowDeleteMany).toHaveBeenCalled();
    expect(mockRevalidate).toHaveBeenCalledWith("/perfil/target");
  });

  it("deletes follow without revalidate when target not found", async () => {
    mockVerify.mockResolvedValue(session);
    mockUserFind.mockResolvedValue(null);
    mockFollowDeleteMany.mockResolvedValue({ count: 0 });
    await unfollowUser("u2");
    expect(mockFollowDeleteMany).toHaveBeenCalled();
    expect(mockRevalidate).not.toHaveBeenCalled();
  });
});

describe("acceptFollow", () => {
  it("updates follow to ACCEPTED and revalidates", async () => {
    mockVerify.mockResolvedValue(session);
    mockFollowUpdate.mockResolvedValue({} as any);
    await acceptFollow("follow-1");
    expect(mockFollowUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "ACCEPTED" } })
    );
    expect(mockRevalidate).toHaveBeenCalledWith("/notificacoes");
  });
});

describe("declineFollow", () => {
  it("deletes follow and revalidates", async () => {
    mockVerify.mockResolvedValue(session);
    mockFollowDelete.mockResolvedValue({} as any);
    await declineFollow("follow-1");
    expect(mockFollowDelete).toHaveBeenCalled();
    expect(mockRevalidate).toHaveBeenCalledWith("/notificacoes");
  });
});

describe("sendGarupaInvite", () => {
  function fd(username: string) {
    const f = new FormData();
    f.append("username", username);
    return f;
  }

  it("returns error when username is empty", async () => {
    mockVerify.mockResolvedValue(session);
    const result = await sendGarupaInvite(undefined, fd(""));
    expect(result.error).toBe("Informe um usuário.");
  });

  it("returns error when user not found", async () => {
    mockVerify.mockResolvedValue(session);
    mockUserFind.mockResolvedValue(null);
    const result = await sendGarupaInvite(undefined, fd("ghost"));
    expect(result.error).toBe("Usuário não encontrado.");
  });

  it("returns error when inviting self", async () => {
    mockVerify.mockResolvedValue(session);
    mockUserFind.mockResolvedValue({ id: "u1", username: "u1" } as any);
    const result = await sendGarupaInvite(undefined, fd("u1"));
    expect(result.error).toBe("Você não pode se convidar.");
  });

  it("returns error when link already exists", async () => {
    mockVerify.mockResolvedValue(session);
    mockUserFind.mockResolvedValue({ id: "u2", username: "u2" } as any);
    mockGarupaFind.mockResolvedValue({ id: "link-1" } as any);
    const result = await sendGarupaInvite(undefined, fd("u2"));
    expect(result.error).toBe("Vínculo já existe ou está pendente.");
  });

  it("creates garupa link and returns success", async () => {
    mockVerify.mockResolvedValue(session);
    mockUserFind.mockResolvedValue({ id: "u2", username: "u2" } as any);
    mockGarupaFind.mockResolvedValue(null);
    mockGarupaCreate.mockResolvedValue({} as any);
    const result = await sendGarupaInvite(undefined, fd("u2"));
    expect(result.success).toBe(true);
    expect(mockRevalidate).toHaveBeenCalledWith("/notificacoes");
  });
});

describe("acceptGarupaLink", () => {
  it("updates link to ACCEPTED and revalidates", async () => {
    mockVerify.mockResolvedValue(session);
    mockGarupaUpdate.mockResolvedValue({} as any);
    await acceptGarupaLink("link-1");
    expect(mockGarupaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "ACCEPTED" } })
    );
    expect(mockRevalidate).toHaveBeenCalledWith("/notificacoes");
  });
});

describe("declineGarupaLink", () => {
  it("deletes garupa link and revalidates", async () => {
    mockVerify.mockResolvedValue(session);
    mockGarupaDelete.mockResolvedValue({} as any);
    await declineGarupaLink("link-1");
    expect(mockGarupaDelete).toHaveBeenCalled();
    expect(mockRevalidate).toHaveBeenCalledWith("/notificacoes");
  });
});

describe("removeGarupaLink", () => {
  it("deleta vínculo onde o usuário é piloto ou garupa e revalida", async () => {
    mockVerify.mockResolvedValue(session);
    mockGarupaDelete.mockResolvedValue({} as any);

    await removeGarupaLink("link-1");

    expect(mockGarupaDelete).toHaveBeenCalledWith({
      where: {
        id: "link-1",
        OR: [{ piloto_id: "u1" }, { garupa_id: "u1" }],
      },
    });
    expect(mockRevalidate).toHaveBeenCalledWith("/notificacoes");
  });
});

describe("markNotificationsRead", () => {
  it("marks all unread notifications as read for the authenticated user", async () => {
    mockVerify.mockResolvedValue(session);
    mockNotificationUpdateMany.mockResolvedValue({ count: 3 });
    await markNotificationsRead("u1");
    expect(mockNotificationUpdateMany).toHaveBeenCalledWith({
      where: { user_id: "u1", read: false },
      data: { read: true },
    });
    expect(mockRevalidate).toHaveBeenCalledWith("/notificacoes");
  });

  it("does nothing when userId does not match session", async () => {
    mockVerify.mockResolvedValue(session);
    await markNotificationsRead("other-user");
    expect(mockNotificationUpdateMany).not.toHaveBeenCalled();
  });
});
