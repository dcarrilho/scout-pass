import { describe, it, expect, vi } from "vitest";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organizer: { findUnique: vi.fn(), create: vi.fn() },
    series: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    challenge: { create: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/dal", () => ({ verifyModerator: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { verifyModerator } from "@/lib/dal";
import {
  createOrganizer,
  createSeries,
  linkSeriesToOrg,
  createChallenge,
  linkChallengeToSeries,
} from "@/app/actions/challenges";

const mockVerify = vi.mocked(verifyModerator);
const mockOrgFindUnique = vi.mocked(prisma.organizer.findUnique);
const mockOrgCreate = vi.mocked(prisma.organizer.create);
const mockSeriesFindUnique = vi.mocked(prisma.series.findUnique);
const mockSeriesCreate = vi.mocked(prisma.series.create);
const mockSeriesUpdate = vi.mocked(prisma.series.update);
const mockChallengeCreate = vi.mocked(prisma.challenge.create);
const mockChallengeUpdate = vi.mocked(prisma.challenge.update);
const mockRedirect = vi.mocked(redirect);
const mockRevalidate = vi.mocked(revalidatePath);

const session = { isAuth: true, userId: "u1", role: "MODERATOR" };

function fd(data: Record<string, string>): FormData {
  const f = new FormData();
  Object.entries(data).forEach(([k, v]) => f.append(k, v));
  return f;
}

beforeEach(() => {
  mockVerify.mockResolvedValue(session);
});

// ─── createOrganizer ──────────────────────────────────────────────────────────

describe("createOrganizer", () => {
  it("returns validation errors for short name", async () => {
    const result = await createOrganizer(undefined, fd({ name: "A" }));
    expect(result?.errors?.name).toBeDefined();
  });

  it("creates organizer with unique slug and redirects to /desafios", async () => {
    mockOrgFindUnique.mockResolvedValue(null);
    mockOrgCreate.mockResolvedValue({ id: "org-1" } as any);

    await expect(createOrganizer(undefined, fd({ name: "Moto Clube" }))).rejects.toThrow("NEXT_REDIRECT");

    expect(mockOrgCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Moto Clube", slug: "moto-clube" }),
      })
    );
    expect(mockRevalidate).toHaveBeenCalledWith("/desafios");
    expect(mockRedirect).toHaveBeenCalledWith("/desafios");
  });

  it("appends suffix when slug already exists", async () => {
    mockOrgFindUnique
      .mockResolvedValueOnce({ id: "existing" } as any)
      .mockResolvedValue(null);
    mockOrgCreate.mockResolvedValue({ id: "org-2" } as any);

    await expect(createOrganizer(undefined, fd({ name: "Clube" }))).rejects.toThrow("NEXT_REDIRECT");

    expect(mockOrgCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: "clube-1" }) })
    );
  });
});

// ─── createSeries ─────────────────────────────────────────────────────────────

describe("createSeries", () => {
  it("returns validation errors for short name", async () => {
    const result = await createSeries(undefined, fd({ name: "X" }));
    expect(result?.errors?.name).toBeDefined();
  });

  it("redirects to org page when series has organizer", async () => {
    mockSeriesCreate.mockResolvedValue({
      id: "s-1",
      organizer: { slug: "moto-clube" },
    } as any);

    await expect(
      createSeries(undefined, fd({ name: "Série Valente", organizer_id: "org-1" }))
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRevalidate).toHaveBeenCalledWith("/desafios/org/moto-clube");
    expect(mockRedirect).toHaveBeenCalledWith("/desafios/org/moto-clube");
  });

  it("redirects to /desafios when series has no organizer", async () => {
    mockSeriesCreate.mockResolvedValue({ id: "s-2", organizer: null } as any);

    await expect(createSeries(undefined, fd({ name: "Série Livre" }))).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/desafios");
  });
});

// ─── linkSeriesToOrg ──────────────────────────────────────────────────────────

describe("linkSeriesToOrg", () => {
  it("does nothing when org not found", async () => {
    mockOrgFindUnique.mockResolvedValue(null);
    await linkSeriesToOrg("s-1", "inexistente");
    expect(mockSeriesUpdate).not.toHaveBeenCalled();
  });

  it("updates series organizer_id and redirects to org page", async () => {
    mockOrgFindUnique.mockResolvedValue({ id: "org-1", slug: "moto-clube" } as any);
    mockSeriesUpdate.mockResolvedValue({} as any);

    await expect(linkSeriesToOrg("s-1", "moto-clube")).rejects.toThrow("NEXT_REDIRECT");

    expect(mockSeriesUpdate).toHaveBeenCalledWith({
      where: { id: "s-1" },
      data: { organizer_id: "org-1" },
    });
    expect(mockRedirect).toHaveBeenCalledWith("/desafios/org/moto-clube");
  });
});

// ─── createChallenge ──────────────────────────────────────────────────────────

describe("createChallenge", () => {
  it("returns validation errors for short name", async () => {
    const result = await createChallenge(undefined, fd({ name: "X" }));
    expect(result?.errors?.name).toBeDefined();
  });

  it("inherits organizer_id from series and redirects to serie page", async () => {
    mockSeriesFindUnique.mockResolvedValue({ organizer_id: "org-1" } as any);
    mockChallengeCreate.mockResolvedValue({ id: "ch-1" } as any);

    await expect(
      createChallenge(undefined, fd({ name: "Estrada Real", series_id: "s-1" }))
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockChallengeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ series_id: "s-1", organizer_id: "org-1" }),
      })
    );
    expect(mockRedirect).toHaveBeenCalledWith("/desafios/serie/s-1");
  });

  it("sets organizer_id to null when series not found", async () => {
    mockSeriesFindUnique.mockResolvedValue(null);
    mockChallengeCreate.mockResolvedValue({ id: "ch-x" } as any);

    await expect(
      createChallenge(undefined, fd({ name: "Orfão", series_id: "s-missing" }))
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockChallengeCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ organizer_id: null }) })
    );
  });

  it("creates standalone challenge and redirects to /desafios", async () => {
    mockChallengeCreate.mockResolvedValue({ id: "ch-2" } as any);

    await expect(createChallenge(undefined, fd({ name: "Avulso" }))).rejects.toThrow("NEXT_REDIRECT");

    expect(mockChallengeCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ series_id: null }) })
    );
    expect(mockRedirect).toHaveBeenCalledWith("/desafios");
  });
});

// ─── linkChallengeToSeries ────────────────────────────────────────────────────

describe("linkChallengeToSeries", () => {
  it("updates challenge series_id and redirects to serie page", async () => {
    mockChallengeUpdate.mockResolvedValue({} as any);

    await expect(linkChallengeToSeries("ch-1", "s-1")).rejects.toThrow("NEXT_REDIRECT");

    expect(mockChallengeUpdate).toHaveBeenCalledWith({
      where: { id: "ch-1" },
      data: { series_id: "s-1" },
    });
    expect(mockRedirect).toHaveBeenCalledWith("/desafios/serie/s-1");
  });
});
