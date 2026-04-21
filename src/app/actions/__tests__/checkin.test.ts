import { describe, it, expect, vi } from "vitest";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const { mockUpload, mockGetPublicUrl } = vi.hoisted(() => ({
  mockUpload: vi.fn(),
  mockGetPublicUrl: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl })),
    },
  })),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    checkIn: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock("@/lib/dal", () => ({ verifySession: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { submitCheckIn } from "@/app/actions/checkin";

const mockVerify = vi.mocked(verifySession);
const mockFindFirst = vi.mocked(prisma.checkIn.findFirst);
const mockCreate = vi.mocked(prisma.checkIn.create);
const mockUpdate = vi.mocked(prisma.checkIn.update);
const mockDelete = vi.mocked(prisma.checkIn.delete);
const mockRedirect = vi.mocked(redirect);
const mockRevalidate = vi.mocked(revalidatePath);

const session = { isAuth: true, userId: "u1", role: "USER" };

function makeFile(name = "photo.jpg", size = 1024): File {
  const blob = new Blob(["x".repeat(size)], { type: "image/jpeg" });
  return new File([blob], name, { type: "image/jpeg" });
}

function makeFormData(overrides: Record<string, string | File | null> = {}): FormData {
  const fd = new FormData();
  fd.append("challenge_id", overrides.challenge_id as string ?? "ch-1");
  fd.append("target_id", overrides.target_id as string ?? "tg-1");
  if (overrides.motorcycle_id) fd.append("motorcycle_id", overrides.motorcycle_id as string);
  fd.append("photo", overrides.photo !== undefined ? (overrides.photo as File) : makeFile());
  return fd;
}

describe("submitCheckIn", () => {
  beforeEach(() => {
    mockVerify.mockResolvedValue(session);
  });

  it("returns error when challenge_id or target_id is missing", async () => {
    const fd = new FormData();
    fd.append("photo", makeFile());
    const result = await submitCheckIn(null, fd);
    expect(result.error).toBe("Dados inválidos.");
  });

  it("returns error when photo is missing", async () => {
    const fd = new FormData();
    fd.append("challenge_id", "ch-1");
    fd.append("target_id", "tg-1");
    const result = await submitCheckIn(null, fd);
    expect(result.error).toBe("A foto é obrigatória.");
  });

  it("returns error when photo exceeds 10MB", async () => {
    const fd = makeFormData({ photo: makeFile("big.jpg", 11 * 1024 * 1024) });
    const result = await submitCheckIn(null, fd);
    expect(result.error).toBe("Foto deve ter no máximo 10MB.");
  });

  it("returns error when target already approved", async () => {
    mockFindFirst.mockResolvedValue({ id: "ci-1" } as any);
    const result = await submitCheckIn(null, makeFormData());
    expect(result.error).toBe("Você já conquistou este local.");
  });

  it("cleans up and returns error when upload fails", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "ci-new" } as any);
    mockUpload.mockResolvedValue({ error: { message: "Storage error" } });

    const result = await submitCheckIn(null, makeFormData());

    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "ci-new" } });
    expect(result.error).toBe("Erro ao enviar foto. Tente novamente.");
  });

  it("creates check-in, uploads photo, revalidates and redirects on success", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "ci-new" } as any);
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.test/photo.jpg" } });
    mockUpdate.mockResolvedValue({} as any);

    await expect(submitCheckIn(null, makeFormData())).rejects.toThrow("NEXT_REDIRECT");

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { photo_url: "https://cdn.test/photo.jpg" } })
    );
    expect(mockRevalidate).toHaveBeenCalledWith("/desafios/ch-1");
    expect(mockRedirect).toHaveBeenCalledWith("/desafios/ch-1?enviado=1");
  });
});
