"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { notifyLeaveApproved, notifyLeaveRejected } from "@/lib/notifications/leave";
import { countLeaveDays } from "@/lib/leave";

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

const adminLeaveEntrySchema = z
  .object({
    userId: z.string().min(1, "Select an employee"),
    leaveTypeId: z.string().min(1, "Leave type is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().trim().min(1, "Reason is required"),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

/** Admin logs a leave entry on behalf of an employee who forgot to submit one — auto-approved. */
export async function createLeaveRequestByAdmin(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = adminLeaveEntrySchema.safeParse({
    userId: formData.get("userId"),
    leaveTypeId: formData.get("leaveTypeId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { userId, leaveTypeId, startDate, endDate, reason } = parsed.data;

  const [employee, leaveType] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.leaveType.findUnique({ where: { id: leaveTypeId } }),
  ]);

  if (!employee || employee.status !== "ACTIVE") {
    return { ok: false, error: "Selected employee is not available" };
  }
  if (!leaveType || !leaveType.isActive) {
    return { ok: false, error: "Selected leave type is not available" };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysCount = await countLeaveDays(start, end);

  const created = await prisma.leaveRequest.create({
    data: {
      userId,
      leaveTypeId,
      startDate: start,
      endDate: end,
      daysCount,
      reason,
      status: "APPROVED",
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      reviewNote: "Logged by admin on the employee's behalf.",
    },
    include: { user: true, leaveType: true },
  });

  await notifyLeaveApproved(created);

  revalidatePath("/admin/leave-requests");
  revalidatePath("/admin/leave");
  revalidatePath(`/admin/leave/${userId}`);
  revalidatePath("/leave");
  return { ok: true };
}
