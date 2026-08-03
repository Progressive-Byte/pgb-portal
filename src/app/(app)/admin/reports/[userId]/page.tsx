import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMissingDaysForUser, getMonthlyHoursForUser } from "@/lib/reports";
import { currentMonthParam, formatMonthLabel, monthRange } from "@/lib/date-range";
import { HoursTrendChart } from "@/components/charts/hours-trend-chart";
import { HoursBarChart } from "@/components/charts/hours-bar-chart";
import { MonthlyHoursChart } from "@/components/charts/monthly-hours-chart";
import { DayReportCards, type DayReportGroup } from "@/components/reports/day-report-cards";

export default async function AdminEmployeeReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ month?: string; taskTypeId?: string; projectId?: string }>;
}) {
  const { userId } = await params;
  const { month: monthParam, taskTypeId, projectId } = await searchParams;
  const month = monthParam ?? currentMonthParam();
  const { from, to } = monthRange(month);

  const [user, taskTypes, projects] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.taskType.findMany({ orderBy: { name: "asc" } }),
    prisma.projectProduct.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!user) {
    notFound();
  }

  const [reports, monthlyHours, missingDates] = await Promise.all([
    prisma.taskReport.findMany({
      where: {
        userId,
        date: { gte: from, lte: to },
        ...(taskTypeId ? { taskTypeId } : {}),
        ...(projectId ? { projectId } : {}),
      },
      include: { taskType: true, project: true },
      orderBy: { date: "desc" },
    }),
    getMonthlyHoursForUser(userId, 6),
    getMissingDaysForUser(userId, from, to),
  ]);

  const totalHours = reports.reduce((sum, r) => sum + Number(r.hoursWorked), 0);

  const byDateMap = new Map<string, typeof reports>();
  const byProject = new Map<string, number>();
  const byTaskType = new Map<string, number>();
  for (const r of reports) {
    const key = r.date.toISOString().slice(0, 10);
    const list = byDateMap.get(key) ?? [];
    list.push(r);
    byDateMap.set(key, list);

    const hours = Number(r.hoursWorked);
    byProject.set(r.project.name, (byProject.get(r.project.name) ?? 0) + hours);
    byTaskType.set(r.taskType.name, (byTaskType.get(r.taskType.name) ?? 0) + hours);
  }

  const trendData = [...byDateMap.entries()]
    .map(([date, dayReports]) => ({
      date,
      hours: dayReports.reduce((sum, r) => sum + Number(r.hoursWorked), 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const byProjectData = [...byProject.entries()]
    .map(([name, hours]) => ({ name, hours }))
    .sort((a, b) => b.hours - a.hours);
  const byTaskTypeData = [...byTaskType.entries()]
    .map(([name, hours]) => ({ name, hours }))
    .sort((a, b) => b.hours - a.hours);

  const dayGroups: DayReportGroup[] = [...byDateMap.entries()].map(([date, dayReports]) => ({
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{user.name}</h1>
        <p className="mt-1 text-neutral-500">
          {user.email} · {formatMonthLabel(month)} · {reports.length} entries · {totalHours}h total
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Month</label>
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Task type</label>
          <select
            name="taskTypeId"
            defaultValue={taskTypeId ?? ""}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {taskTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Project</label>
          <select
            name="projectId"
            defaultValue={projectId ?? ""}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Filter
        </button>
      </form>

      {missingDates.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            {missingDates.length} day{missingDates.length === 1 ? "" : "s"} missing a report
            this month
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {missingDates.map((d) => (
              <span
                key={d}
                className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs text-amber-800"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            Hours per day ({formatMonthLabel(month)})
          </h2>
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
            <HoursTrendChart data={trendData} />
          </div>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            Hours per month (last 6 months)
          </h2>
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
            <MonthlyHoursChart data={monthlyHours} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            By project
          </h2>
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
            <HoursBarChart data={byProjectData} />
          </div>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            By task type
          </h2>
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
            <HoursBarChart data={byTaskTypeData} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Entries
        </h2>
        <DayReportCards days={dayGroups} />
      </div>
    </div>
  );
}
