"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export type ActionResult = { ok: true } | { ok: false; error: string };

const leaveTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  defaultAnnualDays: z.coerce.number().int().min(0, "Must be zero or more"),
});

export async function createLeaveType(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = leaveTypeSchema.safeParse({
    name: formData.get("name"),
    defaultAnnualDays: formData.get("defaultAnnualDays"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.leaveType.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return { ok: false, error: "A leave type with this name already exists" };
  }

  await prisma.leaveType.create({ data: parsed.data });

  revalidatePath("/admin/leave-types");
  return { ok: true };
}

export async function updateLeaveType(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = leaveTypeSchema.safeParse({
    name: formData.get("name"),
    defaultAnnualDays: formData.get("defaultAnnualDays"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.leaveType.update({ where: { id }, data: parsed.data });

  revalidatePath("/admin/leave-types");
  return { ok: true };
}

export async function setLeaveTypeActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  await prisma.leaveType.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/leave-types");
  return { ok: true };
}
