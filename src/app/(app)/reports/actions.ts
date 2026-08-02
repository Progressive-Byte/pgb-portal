"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { getDayExcuseReason, isFutureDate } from "@/lib/reports";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type DayInfo = {
  excuseReason: "leave" | "holiday" | null;
  isFuture: boolean;
  entries: {
    taskName: string;
    taskTypeId: string;
    projectId: string;
    hoursWorked: string;
    notes: string;
    links: string[];
  }[];
};

export async function getDayInfo(date: string): Promise<DayInfo> {
  const session = await requireUser();

  const [excuseReason, existing] = await Promise.all([
    getDayExcuseReason(session.user.id, date),
    prisma.taskReport.findMany({
      where: { userId: session.user.id, date: new Date(date) },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    excuseReason,
    isFuture: isFutureDate(date),
    entries: existing.map((e) => ({
      taskName: e.taskName,
      taskTypeId: e.taskTypeId,
      projectId: e.projectId,
      hoursWorked: e.hoursWorked.toString(),
      notes: e.notes,
      links: e.links,
    })),
  };
}

const entrySchema = z.object({
  taskName: z.string().trim().min(1, "Task name is required"),
  taskTypeId: z.string().min(1, "Task type is required"),
  projectId: z.string().min(1, "Project is required"),
  hoursWorked: z.coerce.number().positive("Hours must be greater than zero"),
  notes: z.string().trim().min(1, "Notes are required"),
  links: z.array(z.string().trim()).default([]),
});

const submitSchema = z.object({
  date: z.string().min(1),
  entries: z.array(entrySchema).min(1, "Add at least one task entry"),
});

export type EntryInput = {
  taskName: string;
  taskTypeId: string;
  projectId: string;
  hoursWorked: string;
  notes: string;
  links: string[];
};

export async function submitDailyReports(
  date: string,
  entries: EntryInput[],
): Promise<ActionResult> {
  const session = await requireUser();

  const parsed = submitSchema.safeParse({ date, entries });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (isFutureDate(parsed.data.date)) {
    return { ok: false, error: "You cannot submit a report for a future date" };
  }

  const excuseReason = await getDayExcuseReason(session.user.id, parsed.data.date);
  if (excuseReason) {
    return {
      ok: false,
      error:
        excuseReason === "leave"
          ? "You are on approved leave this day — no report needed"
          : "This day is a company holiday — no report needed",
    };
  }

  const day = new Date(parsed.data.date);

  const taskTypeIds = [...new Set(parsed.data.entries.map((e) => e.taskTypeId))];
  const projectIds = [...new Set(parsed.data.entries.map((e) => e.projectId))];

  const [taskTypes, projects] = await Promise.all([
    prisma.taskType.findMany({ where: { id: { in: taskTypeIds }, isActive: true } }),
    prisma.projectProduct.findMany({ where: { id: { in: projectIds }, isActive: true } }),
  ]);

  if (taskTypes.length !== taskTypeIds.length || projects.length !== projectIds.length) {
    return { ok: false, error: "One or more selected task types or projects are unavailable" };
  }

  await prisma.$transaction([
    prisma.taskReport.deleteMany({ where: { userId: session.user.id, date: day } }),
    prisma.taskReport.createMany({
      data: parsed.data.entries.map((entry) => ({
        userId: session.user.id,
        date: day,
        taskName: entry.taskName,
        taskTypeId: entry.taskTypeId,
        projectId: entry.projectId,
        hoursWorked: entry.hoursWorked,
        notes: entry.notes,
        links: entry.links.filter((l) => l.length > 0),
      })),
    }),
  ]);

  revalidatePath("/reports");
  return { ok: true };
}
