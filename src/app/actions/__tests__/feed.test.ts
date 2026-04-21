import { describe, it, expect, vi } from "vitest";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reaction: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    comment: { create: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock("@/lib/dal", () => ({
  verifySession: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { toggleReaction, addComment, deleteComment } from "@/app/actions/feed";

const mockVerify = vi.mocked(verifySession);
const mockReactionFind = vi.mocked(prisma.reaction.findUnique);
const mockReactionCreate = vi.mocked(prisma.reaction.create);
const mockReactionDelete = vi.mocked(prisma.reaction.delete);
const mockCommentCreate = vi.mocked(prisma.comment.create);
const mockCommentDelete = vi.mocked(prisma.comment.delete);
const mockRevalidate = vi.mocked(revalidatePath);

const session = { isAuth: true, userId: "u1", role: "USER" };

describe("toggleReaction", () => {
  it("cria reaction quando não existe", async () => {
    mockVerify.mockResolvedValue(session);
    mockReactionFind.mockResolvedValue(null);
    mockReactionCreate.mockResolvedValue({} as any);

    await toggleReaction("checkin-1");

    expect(mockReactionCreate).toHaveBeenCalledWith({
      data: { user_id: "u1", checkin_id: "checkin-1" },
    });
    expect(mockRevalidate).toHaveBeenCalledWith("/home");
  });

  it("remove reaction quando já existe", async () => {
    mockVerify.mockResolvedValue(session);
    mockReactionFind.mockResolvedValue({ id: "reaction-1" } as any);
    mockReactionDelete.mockResolvedValue({} as any);

    await toggleReaction("checkin-1");

    expect(mockReactionDelete).toHaveBeenCalledWith({ where: { id: "reaction-1" } });
    expect(mockReactionCreate).not.toHaveBeenCalled();
    expect(mockRevalidate).toHaveBeenCalledWith("/home");
  });
});

describe("addComment", () => {
  function fd(checkInId: string, content: string) {
    const f = new FormData();
    f.append("checkin_id", checkInId);
    f.append("content", content);
    return f;
  }

  it("não cria comentário quando checkin_id está vazio", async () => {
    mockVerify.mockResolvedValue(session);
    await addComment(fd("", "ótimo check-in!"));
    expect(mockCommentCreate).not.toHaveBeenCalled();
  });

  it("não cria comentário quando conteúdo está vazio", async () => {
    mockVerify.mockResolvedValue(session);
    await addComment(fd("checkin-1", "  "));
    expect(mockCommentCreate).not.toHaveBeenCalled();
  });

  it("não cria comentário quando conteúdo excede 280 caracteres", async () => {
    mockVerify.mockResolvedValue(session);
    await addComment(fd("checkin-1", "a".repeat(281)));
    expect(mockCommentCreate).not.toHaveBeenCalled();
  });

  it("cria comentário e revalida", async () => {
    mockVerify.mockResolvedValue(session);
    mockCommentCreate.mockResolvedValue({} as any);

    await addComment(fd("checkin-1", "Que conquista!"));

    expect(mockCommentCreate).toHaveBeenCalledWith({
      data: { user_id: "u1", checkin_id: "checkin-1", content: "Que conquista!" },
    });
    expect(mockRevalidate).toHaveBeenCalledWith("/home");
  });
});

describe("deleteComment", () => {
  it("deleta apenas o comentário do próprio usuário", async () => {
    mockVerify.mockResolvedValue(session);
    mockCommentDelete.mockResolvedValue({} as any);

    await deleteComment("comment-1");

    expect(mockCommentDelete).toHaveBeenCalledWith({
      where: { id: "comment-1", user_id: "u1" },
    });
    expect(mockRevalidate).toHaveBeenCalledWith("/home");
  });
});
