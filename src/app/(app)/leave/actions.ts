"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { countWeekdays } from "@/lib/leave";
import { notifyLeaveSubmitted } from "@/lib/notifications/leave";

const leaveRequestSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Leave type is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().trim().min(1, "Reason is required"),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createLeaveRequest(formData: FormData): Promise<ActionResult> {
  const session = await requireUser();

  const parsed = leaveRequestSchema.safeParse({
    leaveTypeId: formData.get("leaveTypeId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { leaveTypeId, startDate, endDate, reason } = parsed.data;

  const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
  if (!leaveType || !leaveType.isActive) {
    return { ok: false, error: "Selected leave type is not available" };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysCount = countWeekdays(start, end);

  const created = await prisma.leaveRequest.create({
    data: {
      userId: session.user.id,
      leaveTypeId,
      startDate: start,
      endDate: end,
      daysCount,
      reason,
      status: "PENDING",
    },
    include: { user: true, leaveType: true },
  });

  await notifyLeaveSubmitted(created);

  revalidatePath("/leave");
  return { ok: true };
}

export async function updateLeaveRequest(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireUser();

  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id || existing.status !== "PENDING") {
    return { ok: false, error: "This request can no longer be edited" };
  }

  const parsed = leaveRequestSchema.safeParse({
    leaveTypeId: formData.get("leaveTypeId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { leaveTypeId, startDate, endDate, reason } = parsed.data;

  const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
  if (!leaveType || !leaveType.isActive) {
    return { ok: false, error: "Selected leave type is not available" };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysCount = countWeekdays(start, end);

  await prisma.leaveRequest.update({
    where: { id },
    data: { leaveTypeId, startDate: start, endDate: end, daysCount, reason },
  });

  revalidatePath("/leave");
  return { ok: true };
}

export async function cancelLeaveRequest(id: string): Promise<ActionResult> {
  const session = await requireUser();

  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id || existing.status !== "PENDING") {
    return { ok: false, error: "This request can no longer be cancelled" };
  }

  await prisma.leaveRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/leave");
  return { ok: true };
}
