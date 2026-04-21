import { describe, it, expect, vi } from "vitest";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: vi.fn(), findFirst: vi.fn() },
    motorcycle: { create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock("@/lib/dal", () => ({ verifySession: vi.fn() }));
vi.mock("@/lib/storage", () => ({ uploadAvatar: vi.fn(), uploadCover: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { uploadAvatar } from "@/lib/storage";
import {
  updateProfile, updateAccount,
  addMotorcycle, editMotorcycle,
  setActiveMotorcycle, deleteMotorcycle,
} from "@/app/actions/profile";

const mockVerify = vi.mocked(verifySession);
const mockUserUpdate = vi.mocked(prisma.user.update);
const mockUserFindFirst = vi.mocked(prisma.user.findFirst);
const mockMotoCreate = vi.mocked(prisma.motorcycle.create);
const mockMotoUpdate = vi.mocked(prisma.motorcycle.update);
const mockMotoUpdateMany = vi.mocked(prisma.motorcycle.updateMany);
const mockMotoDelete = vi.mocked(prisma.motorcycle.delete);
const mockUploadAvatar = vi.mocked(uploadAvatar);
const mockRevalidate = vi.mocked(revalidatePath);

const session = { isAuth: true, userId: "u1", role: "USER" };
const YEAR = String(new Date().getFullYear());

function fd(data: Record<string, string | File | null>): FormData {
  const f = new FormData();
  Object.entries(data).forEach(([k, v]) => { if (v !== null) f.append(k, v as string); });
  return f;
}

// ─── updateProfile ───────────────────────────────────────────────────────────
describe("updateProfile", () => {
  beforeEach(() => mockVerify.mockResolvedValue(session));

  it("returns errors for invalid name", async () => {
    const result = await updateProfile(undefined, fd({ name: "A", bio: "" }));
    expect(result?.errors).toBeDefined();
  });

  it("updates user without avatar when no file provided", async () => {
    mockUserUpdate.mockResolvedValue({ username: "ana" } as any);
    const result = await updateProfile(undefined, fd({ name: "Ana", bio: "ok", is_private: "on" }));
    expect(mockUserUpdate).toHaveBeenCalled();
    expect(mockUploadAvatar).not.toHaveBeenCalled();
    expect(result?.success).toBe(true);
  });

  it("uploads avatar and updates user when file provided", async () => {
    const file = new File(["img"], "avatar.jpg", { type: "image/jpeg" });
    mockUploadAvatar.mockResolvedValue("https://cdn.test/avatar.jpg");
    mockUserUpdate.mockResolvedValue({ username: "ana" } as any);

    const f = new FormData();
    f.append("name", "Ana");
    f.append("avatar", file);
    const result = await updateProfile(undefined, f);

    expect(mockUploadAvatar).toHaveBeenCalledWith("u1", file);
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ avatar_url: "https://cdn.test/avatar.jpg" }) })
    );
    expect(result?.success).toBe(true);
  });

  it("returns error message when avatar upload throws Error", async () => {
    const file = new File(["img"], "avatar.jpg", { type: "image/jpeg" });
    mockUploadAvatar.mockRejectedValue(new Error("bucket error"));
    const f = new FormData();
    f.append("name", "Ana");
    f.append("avatar", file);
    const result = await updateProfile(undefined, f);
    expect(result?.message).toContain("bucket error");
  });

  it("returns 'Erro desconhecido' when upload throws non-Error", async () => {
    const file = new File(["img"], "avatar.jpg", { type: "image/jpeg" });
    mockUploadAvatar.mockRejectedValue("string error");
    const f = new FormData();
    f.append("name", "Ana");
    f.append("avatar", file);
    const result = await updateProfile(undefined, f);
    expect(result?.message).toContain("Erro desconhecido");
  });
});

// ─── updateAccount ───────────────────────────────────────────────────────────
describe("updateAccount", () => {
  beforeEach(() => mockVerify.mockResolvedValue(session));

  it("returns errors for invalid data", async () => {
    const result = await updateAccount(undefined, fd({ username: "X", email: "bad" }));
    expect(result?.errors).toBeDefined();
  });

  it("returns error when email already in use", async () => {
    mockUserFindFirst.mockResolvedValue({ id: "u2", email: "taken@test.com", username: "other" } as any);
    const result = await updateAccount(undefined, fd({ username: "newuser", email: "taken@test.com" }));
    expect(result?.errors?.email).toBeDefined();
  });

  it("returns error when username already in use", async () => {
    mockUserFindFirst.mockResolvedValue({ id: "u2", email: "other@test.com", username: "takenuser" } as any);
    const result = await updateAccount(undefined, fd({ username: "takenuser", email: "free@test.com" }));
    expect(result?.errors?.username).toBeDefined();
  });

  it("updates account and returns success", async () => {
    mockUserFindFirst.mockResolvedValue(null);
    mockUserUpdate.mockResolvedValue({} as any);
    const result = await updateAccount(undefined, fd({ username: "freeuser", email: "free@test.com" }));
    expect(result?.success).toBe(true);
    expect(result?.newUsername).toBe("freeuser");
    expect(mockRevalidate).toHaveBeenCalledWith("/perfil/freeuser");
  });
});

// ─── addMotorcycle ───────────────────────────────────────────────────────────
describe("addMotorcycle", () => {
  beforeEach(() => mockVerify.mockResolvedValue(session));

  it("returns errors for invalid data", async () => {
    const result = await addMotorcycle(undefined, fd({ brand: "", model: "", year: "99" }));
    expect(result?.errors).toBeDefined();
  });

  it("creates motorcycle and returns success", async () => {
    mockMotoCreate.mockResolvedValue({} as any);
    const result = await addMotorcycle(undefined, fd({ brand: "Honda", model: "CB500", year: YEAR }));
    expect(mockMotoCreate).toHaveBeenCalled();
    expect(result?.success).toBe(true);
  });
});

// ─── editMotorcycle ──────────────────────────────────────────────────────────
describe("editMotorcycle", () => {
  beforeEach(() => mockVerify.mockResolvedValue(session));

  it("returns errors for invalid data", async () => {
    const result = await editMotorcycle(undefined, fd({ id: "", brand: "", model: "", year: "99" }));
    expect(result?.errors).toBeDefined();
  });

  it("updates motorcycle and returns success", async () => {
    mockMotoUpdate.mockResolvedValue({} as any);
    const result = await editMotorcycle(undefined, fd({ id: "m1", brand: "Yamaha", model: "MT-07", year: YEAR }));
    expect(mockMotoUpdate).toHaveBeenCalled();
    expect(result?.success).toBe(true);
  });
});

// ─── setActiveMotorcycle ─────────────────────────────────────────────────────
describe("setActiveMotorcycle", () => {
  it("sets all to false then target to true and revalidates", async () => {
    mockVerify.mockResolvedValue(session);
    mockMotoUpdateMany.mockResolvedValue({ count: 1 });
    mockMotoUpdate.mockResolvedValue({} as any);

    await setActiveMotorcycle("m1");

    expect(mockMotoUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { is_active: false } })
    );
    expect(mockMotoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { is_active: true } })
    );
    expect(mockRevalidate).toHaveBeenCalledWith("/perfil/editar");
  });
});

// ─── deleteMotorcycle ────────────────────────────────────────────────────────
describe("deleteMotorcycle", () => {
  it("deletes motorcycle and revalidates", async () => {
    mockVerify.mockResolvedValue(session);
    mockMotoDelete.mockResolvedValue({} as any);

    await deleteMotorcycle("m1");

    expect(mockMotoDelete).toHaveBeenCalledWith({ where: { id: "m1", user_id: "u1" } });
    expect(mockRevalidate).toHaveBeenCalledWith("/perfil/editar");
  });
});
