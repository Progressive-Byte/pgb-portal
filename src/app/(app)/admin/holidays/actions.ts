"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export type ActionResult = { ok: true } | { ok: false; error: string };

const holidaySchema = z.object({
  date: z.string().min(1, "Date is required"),
  name: z.string().trim().min(1, "Name is required"),
});

export async function createHoliday(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = holidaySchema.safeParse({
    date: formData.get("date"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const date = new Date(parsed.data.date);
  const existing = await prisma.holiday.findUnique({ where: { date } });
  if (existing) {
    return { ok: false, error: "A holiday is already set for this date" };
  }

  await prisma.holiday.create({ data: { date, name: parsed.data.name } });
  revalidatePath("/admin/holidays");
  return { ok: true };
}

export async function deleteHoliday(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.holiday.delete({ where: { id } });
  revalidatePath("/admin/holidays");
  return { ok: true };
}
