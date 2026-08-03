import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHoursOverview, getMissingReportSummary } from "@/lib/reports";
import { currentMonthParam, formatMonthLabel, monthRange } from "@/lib/date-range";
import { HoursBarChart } from "@/components/charts/hours-bar-chart";
import { HoursTrendChart } from "@/components/charts/hours-trend-chart";
import { EmployeeHoursChart } from "@/components/charts/employee-hours-chart";
import { MonthFilter } from "@/components/shared/month-filter";

export default async function AdminReportsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? currentMonthParam();
  const { from: rangeFrom, to: rangeTo } = monthRange(month);

  const [overview, missing, users] = await Promise.all([
    getHoursOverview(rangeFrom, rangeTo),
    getMissingReportSummary(rangeFrom, rangeTo),
    prisma.user.findMany({
      where: { status: { in: ["ACTIVE", "DISABLED"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Reports overview</h1>
          <p className="mt-1 text-neutral-500">Hours logged and missing reports for {formatMonthLabel(month)}.</p>
        </div>
        <MonthFilter month={month} />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
        <p className="text-sm font-medium text-neutral-500">Total hours logged</p>
        <p className="mt-1 text-3xl font-semibold text-neutral-900">{overview.totalHours}</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Hours per day
        </h2>
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
          <HoursTrendChart data={overview.byDate} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            By employee
          </h2>
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
            <EmployeeHoursChart data={overview.byEmployee} />
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            By project
          </h2>
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
            <HoursBarChart data={overview.byProject} />
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            By task type
          </h2>
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
            <HoursBarChart data={overview.byTaskType} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Missing reports
        </h2>
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          {missing.map((row) => (
            <div key={row.userId} className="border-b border-neutral-100 px-4 py-3 text-sm last:border-b-0">
              <div className="flex items-center justify-between">
                <Link href={`/admin/reports/${row.userId}`} className="font-medium text-neutral-900 hover:underline">
                  {row.name}
                </Link>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {row.missingDates.length} missing
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">{row.missingDates.join(", ")}</p>
            </div>
          ))}
          {missing.length === 0 && (
            <p className="px-4 py-4 text-center text-sm text-neutral-400">
              No missing workdays in this period.
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Browse by employee
        </h2>
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/admin/reports/${user.id}`}
              className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 text-sm last:border-b-0 hover:bg-neutral-50"
            >
              <span className="text-neutral-900">{user.name}</span>
              <span className="text-neutral-400">{user.email}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
