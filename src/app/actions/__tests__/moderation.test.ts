import { describe, it, expect, vi } from "vitest";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    checkIn: { update: vi.fn() },
    notification: { create: vi.fn() },
  },
}));
vi.mock("@/lib/dal", () => ({
  verifyModerator: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { verifyModerator } from "@/lib/dal";
import { approveCheckIn, rejectCheckIn } from "@/app/actions/moderation";

const mockVerifyModerator = vi.mocked(verifyModerator);
const mockUpdate = vi.mocked(prisma.checkIn.update);
const mockNotificationCreate = vi.mocked(prisma.notification.create);
const mockRevalidate = vi.mocked(revalidatePath);

const moderatorSession = { isAuth: true, userId: "mod-1", role: "MODERATOR" };

describe("approveCheckIn", () => {
  it("updates checkIn to APPROVED and revalidates", async () => {
    mockVerifyModerator.mockResolvedValue(moderatorSession);
    mockUpdate.mockResolvedValue({ user_id: "user-1" } as any);
    mockNotificationCreate.mockResolvedValue({} as any);

    await approveCheckIn("checkin-1");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "checkin-1" },
      data: expect.objectContaining({
        status: "APPROVED",
        reviewed_by: "mod-1",
        reviewed_at: expect.any(Date),
      }),
      select: { user_id: true },
    });
    expect(mockRevalidate).toHaveBeenCalledWith("/moderacao");
  });

  it("creates CHECKIN_APPROVED notification for the checkin owner", async () => {
    mockVerifyModerator.mockResolvedValue(moderatorSession);
    mockUpdate.mockResolvedValue({ user_id: "user-1" } as any);
    mockNotificationCreate.mockResolvedValue({} as any);

    await approveCheckIn("checkin-1");

    expect(mockNotificationCreate).toHaveBeenCalledWith({
      data: {
        user_id: "user-1",
        type: "CHECKIN_APPROVED",
        checkin_id: "checkin-1",
      },
    });
  });
});

describe("rejectCheckIn", () => {
  it("updates checkIn to REJECTED with reason and revalidates", async () => {
    mockVerifyModerator.mockResolvedValue(moderatorSession);
    mockUpdate.mockResolvedValue({ user_id: "user-2" } as any);
    mockNotificationCreate.mockResolvedValue({} as any);

    await rejectCheckIn("checkin-2", "Foto fora do local declarado");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "checkin-2" },
      data: expect.objectContaining({
        status: "REJECTED",
        rejection_reason: "Foto fora do local declarado",
        reviewed_by: "mod-1",
        reviewed_at: expect.any(Date),
      }),
      select: { user_id: true },
    });
    expect(mockRevalidate).toHaveBeenCalledWith("/moderacao");
  });

  it("creates CHECKIN_REJECTED notification for the checkin owner", async () => {
    mockVerifyModerator.mockResolvedValue(moderatorSession);
    mockUpdate.mockResolvedValue({ user_id: "user-2" } as any);
    mockNotificationCreate.mockResolvedValue({} as any);

    await rejectCheckIn("checkin-2", "Foto fora do local declarado");

    expect(mockNotificationCreate).toHaveBeenCalledWith({
      data: {
        user_id: "user-2",
        type: "CHECKIN_REJECTED",
        checkin_id: "checkin-2",
      },
    });
  });
});
