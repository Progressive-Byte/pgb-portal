"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export type ActionResult = { ok: true } | { ok: false; error: string };

const nameSchema = z.object({ name: z.string().trim().min(1, "Name is required") });

export async function createTaskType(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.taskType.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return { ok: false, error: "A task type with this name already exists" };
  }

  await prisma.taskType.create({ data: parsed.data });
  revalidatePath("/admin/task-types");
  return { ok: true };
}

export async function updateTaskType(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.taskType.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/task-types");
  return { ok: true };
}

export async function setTaskTypeActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  await prisma.taskType.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/task-types");
  return { ok: true };
}
