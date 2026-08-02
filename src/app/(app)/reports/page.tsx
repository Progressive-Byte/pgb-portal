import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { HoursTrendChart } from "@/components/charts/hours-trend-chart";
import { HoursBarChart } from "@/components/charts/hours-bar-chart";

export default async function ReportsPage() {
  const session = await requireUser();

  const reports = await prisma.taskReport.findMany({
    where: { userId: session.user.id },
    include: { taskType: true, project: true },
    orderBy: { date: "desc" },
  });

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
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  const byProject = new Map<string, number>();
  for (const report of reports) {
    const hours = Number(report.hoursWorked);
    byProject.set(report.project.name, (byProject.get(report.project.name) ?? 0) + hours);
  }
  const byProjectData = [...byProject.entries()]
    .map(([name, hours]) => ({ name, hours }))
    .sort((a, b) => b.hours - a.hours);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Reports</h1>
          <p className="mt-1 text-neutral-500">Your daily task report history.</p>
        </div>
        <Link
          href="/reports/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Log today&apos;s tasks
        </Link>
      </div>

      {reports.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
              Hours per day
            </h2>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <HoursTrendChart data={trendData} />
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
              By project
            </h2>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <HoursBarChart data={byProjectData} />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {[...byDate.entries()].map(([date, dayReports]) => {
          const totalHours = dayReports.reduce((sum, r) => sum + Number(r.hoursWorked), 0);
          return (
            <div key={date} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-neutral-900">{date}</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-500">{totalHours}h total</span>
                  <Link
                    href={`/reports/new?date=${date}`}
                    className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                  >
                    Edit
                  </Link>
                </div>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-neutral-600">
                {dayReports.map((r) => (
                  <li key={r.id}>
                    <span className="text-neutral-900">{r.taskName}</span> — {r.taskType.name} ·{" "}
                    {r.project.name} · {Number(r.hoursWorked)}h
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {byDate.size === 0 && (
          <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-center text-neutral-400">
            No task reports yet.
          </p>
        )}
      </div>
    </div>
  );
}
