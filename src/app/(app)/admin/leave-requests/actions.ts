"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { notifyLeaveApproved, notifyLeaveRejected } from "@/lib/notifications/leave";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function reviewLeaveRequest(
  id: string,
  status: "APPROVED" | "REJECTED",
  note: string | null,
): Promise<ActionResult> {
  const session = await requireAdmin();

  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing || existing.status !== "PENDING") {
    return { ok: false, error: "This request is no longer pending" };
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      reviewNote: note || null,
    },
    include: { user: true, leaveType: true },
  });

  if (status === "APPROVED") {
    await notifyLeaveApproved(updated);
  } else {
    await notifyLeaveRejected(updated);
  }

  revalidatePath("/admin/leave-requests");
  revalidatePath(`/admin/leave/${existing.userId}`);
  return { ok: true };
}

export async function approveLeaveRequest(id: string, note: string | null) {
  return reviewLeaveRequest(id, "APPROVED", note);
}

export async function rejectLeaveRequest(id: string, note: string | null) {
  return reviewLeaveRequest(id, "REJECTED", note);
}
