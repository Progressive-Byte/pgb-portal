"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export type ActionResult = { ok: true } | { ok: false; error: string };

const overrideSchema = z.object({
  leaveTypeId: z.string().min(1),
  year: z.coerce.number().int(),
  allocatedDays: z.coerce.number().int().min(0, "Must be zero or more"),
});

export async function setLeaveBalanceOverride(
  userId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = overrideSchema.safeParse({
    leaveTypeId: formData.get("leaveTypeId"),
    year: formData.get("year"),
    allocatedDays: formData.get("allocatedDays"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { leaveTypeId, year, allocatedDays } = parsed.data;

  await prisma.leaveBalance.upsert({
    where: { userId_leaveTypeId_year: { userId, leaveTypeId, year } },
    update: { allocatedDays },
    create: { userId, leaveTypeId, year, allocatedDays },
  });

  revalidatePath(`/admin/leave/${userId}`);
  return { ok: true };
}
