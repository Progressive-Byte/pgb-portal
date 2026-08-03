import { prisma } from "@/lib/prisma";
import { getWorkweekConfig, listWorkdays } from "@/lib/workweek";

export type DayExcuseReason = "leave" | "holiday" | null;

export function toUtcDate(date: Date | string) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function getDayExcuseReason(
  userId: string,
  date: Date | string,
): Promise<DayExcuseReason> {
  const day = toUtcDate(date);

  const [holiday, leave] = await Promise.all([
    prisma.holiday.findUnique({ where: { date: day } }),
    prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: "APPROVED",
        startDate: { lte: day },
        endDate: { gte: day },
      },
    }),
  ]);

  if (holiday) return "holiday";
  if (leave) return "leave";
  return null;
}

export function isFutureDate(date: Date | string) {
  const day = toUtcDate(date);
  const today = toUtcDate(new Date());
  return day > today;
}

export type MissingReportRow = {
  userId: string;
  name: string;
  missingDates: string[];
};

/**
 * Active employees' workdays in [from, to] (capped at today) with no report, no
 * holiday, and no leave request covering them. A PENDING (not just APPROVED)
 * leave request also counts as "covered" — filing one resolves the nag even
 * before admin approval; a later REJECTED/CANCELLED request brings the day back.
 */
export async function getMissingReportSummary(
  from: Date,
  to: Date,
): Promise<MissingReportRow[]> {
  const today = toUtcDate(new Date());
  const rangeEnd = to > today ? today : to;
  const rangeStart = toUtcDate(from);

  if (rangeStart > rangeEnd) return [];

  const [config, employees, holidays, leaveRequests, reports] = await Promise.all([
    getWorkweekConfig(),
    prisma.user.findMany({ where: { role: "EMPLOYEE", status: "ACTIVE" } }),
    prisma.holiday.findMany({ where: { date: { gte: rangeStart, lte: rangeEnd } } }),
    prisma.leaveRequest.findMany({
      where: {
        status: { in: ["APPROVED", "PENDING"] },
        startDate: { lte: rangeEnd },
        endDate: { gte: rangeStart },
      },
    }),
    prisma.taskReport.findMany({
      where: { date: { gte: rangeStart, lte: rangeEnd } },
      select: { userId: true, date: true },
    }),
  ]);

  const holidaySet = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));

  const reportedByUser = new Map<string, Set<string>>();
  for (const r of reports) {
    const key = r.date.toISOString().slice(0, 10);
    if (!reportedByUser.has(r.userId)) reportedByUser.set(r.userId, new Set());
    reportedByUser.get(r.userId)!.add(key);
  }

  const leaveByUser = new Map<string, { start: Date; end: Date }[]>();
  for (const lr of leaveRequests) {
    if (!leaveByUser.has(lr.userId)) leaveByUser.set(lr.userId, []);
    leaveByUser.get(lr.userId)!.push({ start: lr.startDate, end: lr.endDate });
  }

  const workdays = listWorkdays(rangeStart, rangeEnd, config);

  return employees
    .map((emp) => {
      const reportedDates = reportedByUser.get(emp.id) ?? new Set<string>();
      const leaves = leaveByUser.get(emp.id) ?? [];
      const joinDate = toUtcDate(emp.joinDate);

      const missingDates = workdays
        .filter((day) => day >= joinDate)
        .filter((day) => {
          const key = day.toISOString().slice(0, 10);
          if (holidaySet.has(key)) return false;
          if (reportedDates.has(key)) return false;
          if (leaves.some((l) => day >= l.start && day <= l.end)) return false;
          return true;
        })
        .map((day) => day.toISOString().slice(0, 10));

      return { userId: emp.id, name: emp.name, missingDates };
    })
    .filter((row) => row.missingDates.length > 0);
}

/** Same "covered" rule as getMissingReportSummary, scoped to one employee. */
export async function getMissingDaysForUser(
  userId: string,
  from: Date,
  to: Date,
): Promise<string[]> {
  const today = toUtcDate(new Date());
  const rangeEnd = to > today ? today : to;
  const rangeStart = toUtcDate(from);

  if (rangeStart > rangeEnd) return [];

  const [config, user, holidays, leaveRequests, reports] = await Promise.all([
    getWorkweekConfig(),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.holiday.findMany({ where: { date: { gte: rangeStart, lte: rangeEnd } } }),
    prisma.leaveRequest.findMany({
      where: {
        userId,
        status: { in: ["APPROVED", "PENDING"] },
        startDate: { lte: rangeEnd },
        endDate: { gte: rangeStart },
      },
    }),
    prisma.taskReport.findMany({
      where: { userId, date: { gte: rangeStart, lte: rangeEnd } },
      select: { date: true },
    }),
  ]);

  if (!user) return [];

  const holidaySet = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));
  const reportedDates = new Set(reports.map((r) => r.date.toISOString().slice(0, 10)));
  const joinDate = toUtcDate(user.joinDate);
  const workdays = listWorkdays(rangeStart, rangeEnd, config);

  return workdays
    .filter((day) => day >= joinDate)
    .filter((day) => {
      const key = day.toISOString().slice(0, 10);
      if (holidaySet.has(key)) return false;
      if (reportedDates.has(key)) return false;
      if (leaveRequests.some((l) => day >= l.startDate && day <= l.endDate)) return false;
      return true;
    })
    .map((day) => day.toISOString().slice(0, 10));
}

export type HoursOverview = {
  byEmployee: { userId: string; name: string; hours: number }[];
  byProject: { name: string; hours: number }[];
  byTaskType: { name: string; hours: number }[];
  byDate: { date: string; hours: number }[];
  totalHours: number;
};

export async function getHoursOverview(
  from: Date,
  to: Date,
  userId?: string,
): Promise<HoursOverview> {
  const reports = await prisma.taskReport.findMany({
    where: {
      date: { gte: toUtcDate(from), lte: toUtcDate(to) },
      ...(userId ? { userId } : {}),
    },
    include: { user: true, project: true, taskType: true },
  });

  const byEmployee = new Map<string, { name: string; hours: number }>();
  const byProject = new Map<string, number>();
  const byTaskType = new Map<string, number>();
  const byDate = new Map<string, number>();
  let totalHours = 0;

  for (const r of reports) {
    const hours = Number(r.hoursWorked);
    totalHours += hours;

    const emp = byEmployee.get(r.userId) ?? { name: r.user.name, hours: 0 };
    emp.hours += hours;
    byEmployee.set(r.userId, emp);

    byProject.set(r.project.name, (byProject.get(r.project.name) ?? 0) + hours);
    byTaskType.set(r.taskType.name, (byTaskType.get(r.taskType.name) ?? 0) + hours);

    const dateKey = r.date.toISOString().slice(0, 10);
    byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + hours);
  }

  return {
    byEmployee: [...byEmployee.entries()]
      .map(([userId, v]) => ({ userId, ...v }))
      .sort((a, b) => b.hours - a.hours),
    byProject: [...byProject.entries()]
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours),
    byTaskType: [...byTaskType.entries()]
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours),
    byDate: [...byDate.entries()]
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    totalHours,
  };
}

export type MonthlyHours = { month: string; hours: number };

/** Total hours per calendar month for one user, most recent `monthsBack` months. */
export async function getMonthlyHoursForUser(
  userId: string,
  monthsBack: number,
): Promise<MonthlyHours[]> {
  const today = toUtcDate(new Date());
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (monthsBack - 1), 1));

  const reports = await prisma.taskReport.findMany({
    where: { userId, date: { gte: start } },
    select: { date: true, hoursWorked: true },
  });

  const byMonth = new Map<string, number>();
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    byMonth.set(d.toISOString().slice(0, 7), 0);
  }

  for (const r of reports) {
    const key = r.date.toISOString().slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(r.hoursWorked));
  }

  return [...byMonth.entries()].map(([month, hours]) => ({ month, hours }));
}
