"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export type ActionResult = { ok: true } | { ok: false; error: string };

const policySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  category: z.string().trim().min(1, "Category is required"),
  embedUrl: z.string().trim().url("Enter a valid URL"),
  sortOrder: z.coerce.number().int(),
});

export async function createPolicy(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = policySchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    embedUrl: formData.get("embedUrl"),
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.policyDocument.create({ data: parsed.data });

  revalidatePath("/admin/policies");
  revalidatePath("/policies");
  return { ok: true };
}

export async function updatePolicy(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = policySchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    embedUrl: formData.get("embedUrl"),
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.policyDocument.update({ where: { id }, data: parsed.data });

  revalidatePath("/admin/policies");
  revalidatePath("/policies");
  revalidatePath(`/policies/${id}`);
  return { ok: true };
}

export async function deletePolicy(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.policyDocument.delete({ where: { id } });

  revalidatePath("/admin/policies");
  revalidatePath("/policies");
  return { ok: true };
}
