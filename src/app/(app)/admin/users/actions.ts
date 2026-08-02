"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { sendMail, escapeHtml } from "@/lib/mail";
import {
  generateInviteToken,
  inviteExpiryDate,
  inviteAcceptUrl,
} from "@/lib/invite-token";

const inviteSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
  title: z.string().trim().optional(),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

async function sendInviteEmail(name: string, email: string, token: string) {
  const url = inviteAcceptUrl(token);
  await sendMail({
    to: email,
    subject: "You're invited to PGB Portal",
    html: `<p>Hi ${escapeHtml(name)},</p><p>You've been invited to PGB Portal. Click the link below to set your password and activate your account:</p><p><a href="${url}">${url}</a></p><p>This link expires in 7 days.</p>`,
  });
}

export async function inviteUser(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = inviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    title: formData.get("title") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, role, title } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "A user with this email already exists" };
  }

  const token = generateInviteToken();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      title: role === "ADMIN" ? title || null : null,
      status: "INVITED",
      inviteTokens: {
        create: {
          token,
          expiresAt: inviteExpiryDate(),
        },
      },
    },
  });

  await sendInviteEmail(user.name, user.email, token);

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function resendInvite(userId: string): Promise<ActionResult> {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "INVITED") {
    return { ok: false, error: "User is not in invited status" };
  }

  const token = generateInviteToken();
  await prisma.inviteToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: inviteExpiryDate(),
    },
  });

  await sendInviteEmail(user.name, user.email, token);

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function revokeInvite(userId: string): Promise<ActionResult> {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "INVITED") {
    return { ok: false, error: "User is not in invited status" };
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserStatus(
  userId: string,
  status: "ACTIVE" | "DISABLED",
): Promise<ActionResult> {
  const session = await requireAdmin();

  if (session.user.id === userId) {
    return { ok: false, error: "You cannot change your own status" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status === "INVITED") {
    return { ok: false, error: "User is not active or disabled" };
  }

  await prisma.user.update({ where: { id: userId }, data: { status } });

  revalidatePath("/admin/users");
  return { ok: true };
}
