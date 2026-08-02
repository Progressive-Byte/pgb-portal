"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const acceptSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AcceptResult = { ok: true } | { ok: false; error: string };

export async function acceptInvite(
  token: string,
  formData: FormData,
): Promise<AcceptResult> {
  const parsed = acceptSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const inviteToken = await prisma.inviteToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (
    !inviteToken ||
    inviteToken.usedAt ||
    inviteToken.expiresAt < new Date() ||
    inviteToken.user.status !== "INVITED"
  ) {
    return { ok: false, error: "This invite link is invalid or has expired." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: inviteToken.userId },
      data: { passwordHash, status: "ACTIVE" },
    }),
    prisma.inviteToken.update({
      where: { id: inviteToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}
