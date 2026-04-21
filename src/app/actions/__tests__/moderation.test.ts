import { describe, it, expect, vi } from "vitest";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/prisma", () => ({
  prisma: { checkIn: { update: vi.fn() } },
}));
vi.mock("@/lib/dal", () => ({
  verifyModerator: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { verifyModerator } from "@/lib/dal";
import { approveCheckIn, rejectCheckIn } from "@/app/actions/moderation";

const mockVerifyModerator = vi.mocked(verifyModerator);
const mockUpdate = vi.mocked(prisma.checkIn.update);
const mockRevalidate = vi.mocked(revalidatePath);

const moderatorSession = { isAuth: true, userId: "mod-1", role: "MODERATOR" };

describe("approveCheckIn", () => {
  it("updates checkIn to APPROVED and revalidates", async () => {
    mockVerifyModerator.mockResolvedValue(moderatorSession);
    mockUpdate.mockResolvedValue({} as any);

    await approveCheckIn("checkin-1");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "checkin-1" },
      data: expect.objectContaining({
        status: "APPROVED",
        reviewed_by: "mod-1",
        reviewed_at: expect.any(Date),
      }),
    });
    expect(mockRevalidate).toHaveBeenCalledWith("/moderacao");
  });
});

describe("rejectCheckIn", () => {
  it("updates checkIn to REJECTED with reason and revalidates", async () => {
    mockVerifyModerator.mockResolvedValue(moderatorSession);
    mockUpdate.mockResolvedValue({} as any);

    await rejectCheckIn("checkin-2", "Foto fora do local declarado");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "checkin-2" },
      data: expect.objectContaining({
        status: "REJECTED",
        rejection_reason: "Foto fora do local declarado",
        reviewed_by: "mod-1",
        reviewed_at: expect.any(Date),
      }),
    });
    expect(mockRevalidate).toHaveBeenCalledWith("/moderacao");
  });
});
