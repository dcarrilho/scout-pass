import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

vi.mock("@/lib/session", () => ({
  decrypt: vi.fn(),
}));

import { decrypt } from "@/lib/session";
import { verifySession, verifyModerator } from "@/lib/dal";

const mockDecrypt = vi.mocked(decrypt);
const mockRedirect = vi.mocked(redirect);

const mockCookieStore = { get: vi.fn() };

beforeEach(() => {
  vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
});

describe("verifySession", () => {
  it("returns session data when cookie is valid", async () => {
    mockCookieStore.get.mockReturnValue({ value: "valid-token" });
    mockDecrypt.mockResolvedValue({ userId: "u1", role: "USER", expiresAt: new Date() });

    const session = await verifySession();
    expect(session).toEqual({ isAuth: true, userId: "u1", role: "USER" });
  });

  it("redirects to /login when no cookie exists", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    mockDecrypt.mockResolvedValue(null);

    await expect(verifySession()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login when token is invalid", async () => {
    mockCookieStore.get.mockReturnValue({ value: "bad-token" });
    mockDecrypt.mockResolvedValue(null);

    await expect(verifySession()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});

describe("verifyModerator", () => {
  beforeEach(() => {
    mockCookieStore.get.mockReturnValue({ value: "token" });
  });

  it("allows MODERATOR role through", async () => {
    mockDecrypt.mockResolvedValue({ userId: "u1", role: "MODERATOR", expiresAt: new Date() });
    const session = await verifyModerator();
    expect(session.role).toBe("MODERATOR");
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("allows ADMIN role through", async () => {
    mockDecrypt.mockResolvedValue({ userId: "u1", role: "ADMIN", expiresAt: new Date() });
    const session = await verifyModerator();
    expect(session.role).toBe("ADMIN");
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects USER role to /home", async () => {
    mockDecrypt.mockResolvedValue({ userId: "u1", role: "USER", expiresAt: new Date() });
    await expect(verifyModerator()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/home");
  });
});
