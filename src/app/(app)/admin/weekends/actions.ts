"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { toUtcDate } from "@/lib/workweek";

export type ActionResult = { ok: true } | { ok: false; error: string };

function isSaturday(date: Date) {
  return toUtcDate(date).getUTCDay() === 6;
}

export async function setWeekendAnchor(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = z.string().min(1).safeParse(formData.get("anchorOffSaturday"));
  if (!parsed.success) {
    return { ok: false, error: "Pick a date" };
  }

  const date = toUtcDate(parsed.data);
  if (!isSaturday(date)) {
    return { ok: false, error: "The anchor date must be a Saturday" };
  }

  await prisma.weekendConfig.upsert({
    where: { id: "singleton" },
    update: { anchorOffSaturday: date },
    create: { id: "singleton", anchorOffSaturday: date },
  });

  revalidatePath("/admin/weekends");
  return { ok: true };
}

const exceptionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  isOff: z.enum(["true", "false"]),
  note: z.string().trim().optional(),
});

export async function setWeekendException(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = exceptionSchema.safeParse({
    date: formData.get("date"),
    isOff: formData.get("isOff"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const date = toUtcDate(parsed.data.date);
  const isOff = parsed.data.isOff === "true";

  await prisma.weekendException.upsert({
    where: { date },
    update: { isOff, note: parsed.data.note ?? null },
    create: { date, isOff, note: parsed.data.note ?? null },
  });

  revalidatePath("/admin/weekends");
  return { ok: true };
}

export async function removeWeekendException(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.weekendException.delete({ where: { id } });
  revalidatePath("/admin/weekends");
  return { ok: true };
}
