import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { getMissingDaysForUser } from "@/lib/reports";
import { currentMonthParam, formatMonthLabel, monthRange } from "@/lib/date-range";
import { HoursTrendChart } from "@/components/charts/hours-trend-chart";
import { HoursBarChart } from "@/components/charts/hours-bar-chart";
import { MonthFilter } from "@/components/shared/month-filter";
import { MissingReportsPanel } from "@/components/reports/missing-reports-panel";
import { DayReportCards, type DayReportGroup } from "@/components/reports/day-report-cards";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await requireUser();
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? currentMonthParam();
  const { from, to } = monthRange(month);

  const [reports, missingDates] = await Promise.all([
    prisma.taskReport.findMany({
      where: { userId: session.user.id, date: { gte: from, lte: to } },
      include: { taskType: true, project: true },
      orderBy: { date: "desc" },
    }),
    getMissingDaysForUser(session.user.id, from, to),
  ]);

  const byDate = new Map<string, typeof reports>();
  for (const report of reports) {
    const key = report.date.toISOString().slice(0, 10);
    const list = byDate.get(key) ?? [];
    list.push(report);
    byDate.set(key, list);
  }

  const trendData = [...byDate.entries()]
    .map(([date, dayReports]) => ({
      date,
      hours: dayReports.reduce((sum, r) => sum + Number(r.hoursWorked), 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const byProject = new Map<string, number>();
  const byTaskType = new Map<string, number>();
  for (const report of reports) {
    const hours = Number(report.hoursWorked);
    byProject.set(report.project.name, (byProject.get(report.project.name) ?? 0) + hours);
    byTaskType.set(report.taskType.name, (byTaskType.get(report.taskType.name) ?? 0) + hours);
  }
  const byProjectData = [...byProject.entries()]
    .map(([name, hours]) => ({ name, hours }))
    .sort((a, b) => b.hours - a.hours);
  const byTaskTypeData = [...byTaskType.entries()]
    .map(([name, hours]) => ({ name, hours }))
    .sort((a, b) => b.hours - a.hours);

  const dayGroups: DayReportGroup[] = [...byDate.entries()].map(([date, dayReports]) => ({
    date,
    entries: dayReports.map((r) => ({
      id: r.id,
      taskName: r.taskName,
      taskTypeName: r.taskType.name,
      projectName: r.project.name,
      hours: Number(r.hoursWorked),
      notes: r.notes,
      links: r.links,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Reports</h1>
          <p className="mt-1 text-neutral-500">{formatMonthLabel(month)}</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthFilter month={month} />
          <Link
            href="/reports/new"
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Log today&apos;s tasks
          </Link>
        </div>
      </div>

      <MissingReportsPanel dates={missingDates} />

      {reports.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
              Hours per day
            </h2>
            <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
              <HoursTrendChart data={trendData} />
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
              By project
            </h2>
            <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
              <HoursBarChart data={byProjectData} />
            </div>
          </div>
          <div className="lg:col-span-3">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
              By task type
            </h2>
            <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
              <HoursBarChart data={byTaskTypeData} />
            </div>
          </div>
        </div>
      )}

      <DayReportCards days={dayGroups} editHref={(date) => `/reports/new?date=${date}`} />
    </div>
  );
}
