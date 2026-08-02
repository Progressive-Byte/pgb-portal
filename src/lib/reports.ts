import { prisma } from "@/lib/prisma";

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

function listWeekdays(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export type MissingReportRow = {
  userId: string;
  name: string;
  missingDates: string[];
};

/** Active employees' workdays in [from, to] (capped at today) with no report, no holiday, no approved leave. */
export async function getMissingReportSummary(
  from: Date,
  to: Date,
): Promise<MissingReportRow[]> {
  const today = toUtcDate(new Date());
  const rangeEnd = to > today ? today : to;
  const rangeStart = toUtcDate(from);

  if (rangeStart > rangeEnd) return [];

  const [employees, holidays, leaveRequests, reports] = await Promise.all([
    prisma.user.findMany({ where: { role: "EMPLOYEE", status: "ACTIVE" } }),
    prisma.holiday.findMany({ where: { date: { gte: rangeStart, lte: rangeEnd } } }),
    prisma.leaveRequest.findMany({
      where: { status: "APPROVED", startDate: { lte: rangeEnd }, endDate: { gte: rangeStart } },
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

  const workdays = listWeekdays(rangeStart, rangeEnd);

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

export type HoursOverview = {
  byEmployee: { userId: string; name: string; hours: number }[];
  byProject: { name: string; hours: number }[];
  byTaskType: { name: string; hours: number }[];
  totalHours: number;
};

export async function getHoursOverview(from: Date, to: Date): Promise<HoursOverview> {
  const reports = await prisma.taskReport.findMany({
    where: { date: { gte: toUtcDate(from), lte: toUtcDate(to) } },
    include: { user: true, project: true, taskType: true },
  });

  const byEmployee = new Map<string, { name: string; hours: number }>();
  const byProject = new Map<string, number>();
  const byTaskType = new Map<string, number>();
  let totalHours = 0;

  for (const r of reports) {
    const hours = Number(r.hoursWorked);
    totalHours += hours;

    const emp = byEmployee.get(r.userId) ?? { name: r.user.name, hours: 0 };
    emp.hours += hours;
    byEmployee.set(r.userId, emp);

    byProject.set(r.project.name, (byProject.get(r.project.name) ?? 0) + hours);
    byTaskType.set(r.taskType.name, (byTaskType.get(r.taskType.name) ?? 0) + hours);
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
    totalHours,
  };
}
