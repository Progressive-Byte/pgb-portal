import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHoursOverview, getMissingReportSummary } from "@/lib/reports";

function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function AdminReportsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;

  const today = new Date();
  const rangeFrom = from ? new Date(from) : startOfMonth(today);
  const rangeTo = to ? new Date(to) : today;

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
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Reports overview</h1>
        <p className="mt-1 text-neutral-500">Hours logged and missing reports for the period.</p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">From</label>
          <input
            type="date"
            name="from"
            defaultValue={toInputDate(rangeFrom)}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">To</label>
          <input
            type="date"
            name="to"
            defaultValue={toInputDate(rangeTo)}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Apply
        </button>
      </form>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <p className="text-sm font-medium text-neutral-500">Total hours logged</p>
        <p className="mt-1 text-3xl font-semibold text-neutral-900">{overview.totalHours}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            By employee
          </h2>
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            {overview.byEmployee.map((e) => (
              <Link
                key={e.userId}
                href={`/admin/reports/${e.userId}`}
                className="flex items-center justify-between border-b border-neutral-100 px-4 py-2 text-sm last:border-b-0 hover:bg-neutral-50"
              >
                <span className="text-neutral-900">{e.name}</span>
                <span className="text-neutral-500">{e.hours}h</span>
              </Link>
            ))}
            {overview.byEmployee.length === 0 && (
              <p className="px-4 py-4 text-center text-sm text-neutral-400">No data.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            By project
          </h2>
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            {overview.byProject.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between border-b border-neutral-100 px-4 py-2 text-sm last:border-b-0"
              >
                <span className="text-neutral-900">{p.name}</span>
                <span className="text-neutral-500">{p.hours}h</span>
              </div>
            ))}
            {overview.byProject.length === 0 && (
              <p className="px-4 py-4 text-center text-sm text-neutral-400">No data.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            By task type
          </h2>
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            {overview.byTaskType.map((t) => (
              <div
                key={t.name}
                className="flex items-center justify-between border-b border-neutral-100 px-4 py-2 text-sm last:border-b-0"
              >
                <span className="text-neutral-900">{t.name}</span>
                <span className="text-neutral-500">{t.hours}h</span>
              </div>
            ))}
            {overview.byTaskType.length === 0 && (
              <p className="px-4 py-4 text-center text-sm text-neutral-400">No data.</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Missing reports
        </h2>
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
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
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
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
