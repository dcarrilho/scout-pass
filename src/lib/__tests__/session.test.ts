// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";

vi.mock("@/lib/session", async () => {
  // Re-import actual to let the module resolve with mocked server-only
  const actual = await vi.importActual<typeof import("@/lib/session")>("@/lib/session");
  return actual;
});

import { encrypt, decrypt, createSession, deleteSession } from "@/lib/session";

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

beforeEach(() => {
  vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
});

describe("encrypt / decrypt", () => {
  const payload = { userId: "user-1", role: "USER", expiresAt: new Date() };

  it("produces a non-empty JWT string", async () => {
    const token = await encrypt(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("round-trips: decrypt returns the original payload fields", async () => {
    const token = await encrypt(payload);
    const result = await decrypt(token);
    expect(result?.userId).toBe(payload.userId);
    expect(result?.role).toBe(payload.role);
  });

  it("returns null for an invalid token", async () => {
    expect(await decrypt("not.a.jwt")).toBeNull();
  });

  it("returns null for an empty string", async () => {
    expect(await decrypt("")).toBeNull();
  });

  it("returns null for undefined", async () => {
    expect(await decrypt(undefined)).toBeNull();
  });
});

describe("createSession", () => {
  it("calls cookieStore.set with 'session' and the right options", async () => {
    await createSession("user-123", "MODERATOR");
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "session",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      })
    );
  });
});

describe("deleteSession", () => {
  it("calls cookieStore.delete with 'session'", async () => {
    await deleteSession();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("session");
  });
});
