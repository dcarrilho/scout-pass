import { describe, it, expect, vi } from "vitest";
import { redirect } from "next/navigation";

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({
  createSession: vi.fn(),
  deleteSession: vi.fn(),
}));

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { signup, login, logout } from "@/app/actions/auth";

const mockHash = vi.mocked(bcrypt.hash);
const mockCompare = vi.mocked(bcrypt.compare);
const mockFindFirst = vi.mocked(prisma.user.findFirst);
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockCreate = vi.mocked(prisma.user.create);
const mockCreateSession = vi.mocked(createSession);
const mockDeleteSession = vi.mocked(deleteSession);
const mockRedirect = vi.mocked(redirect);

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

// ─── signup ──────────────────────────────────────────────────────────────────
describe("signup", () => {
  const validData = { name: "João", username: "joao01", email: "joao@test.com", password: "senha123" };

  it("returns validation errors for invalid input", async () => {
    const fd = makeFormData({ name: "J", username: "x", email: "bad", password: "123" });
    const result = await signup(undefined, fd);
    expect(result?.errors).toBeDefined();
  });

  it("returns message when email already exists", async () => {
    mockFindFirst.mockResolvedValue({ id: "u1", email: "joao@test.com", username: "other" } as any);
    const fd = makeFormData(validData);
    const result = await signup(undefined, fd);
    expect(result?.message).toBe("E-mail já cadastrado.");
  });

  it("returns message when username already exists", async () => {
    mockFindFirst.mockResolvedValue({ id: "u1", email: "other@test.com", username: "joao01" } as any);
    const fd = makeFormData(validData);
    const result = await signup(undefined, fd);
    expect(result?.message).toBe("Nome de usuário já em uso.");
  });

  it("creates user, calls createSession and redirects on success", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockHash.mockResolvedValue("hashed" as never);
    mockCreate.mockResolvedValue({ id: "u2", role: "USER" } as any);

    const fd = makeFormData(validData);
    await expect(signup(undefined, fd)).rejects.toThrow("NEXT_REDIRECT");

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: "joao@test.com" }) })
    );
    expect(mockCreateSession).toHaveBeenCalledWith("u2", "USER");
    expect(mockRedirect).toHaveBeenCalledWith("/home");
  });
});

// ─── login ───────────────────────────────────────────────────────────────────
describe("login", () => {
  it("returns error for invalid schema (empty email)", async () => {
    const fd = makeFormData({ email: "", password: "abc" });
    const result = await login(undefined, fd);
    expect(result?.message).toBe("E-mail ou senha incorretos.");
  });

  it("returns error when user not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    const fd = makeFormData({ email: "a@b.com", password: "senha123" });
    const result = await login(undefined, fd);
    expect(result?.message).toBe("E-mail ou senha incorretos.");
  });

  it("returns error when password does not match", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", password: "hashed", role: "USER" } as any);
    mockCompare.mockResolvedValue(false as never);
    const fd = makeFormData({ email: "a@b.com", password: "wrongpass" });
    const result = await login(undefined, fd);
    expect(result?.message).toBe("E-mail ou senha incorretos.");
  });

  it("calls createSession and redirects on valid credentials", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", password: "hashed", role: "MODERATOR" } as any);
    mockCompare.mockResolvedValue(true as never);
    const fd = makeFormData({ email: "a@b.com", password: "senha123" });
    await expect(login(undefined, fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockCreateSession).toHaveBeenCalledWith("u1", "MODERATOR");
    expect(mockRedirect).toHaveBeenCalledWith("/home");
  });
});

// ─── logout ──────────────────────────────────────────────────────────────────
describe("logout", () => {
  it("deletes session and redirects to /login", async () => {
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockDeleteSession).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
