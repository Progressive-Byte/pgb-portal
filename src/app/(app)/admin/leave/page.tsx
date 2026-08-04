import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminLeaveOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const [employees, leaveTypes, approvedRequests] = await Promise.all([
    prisma.user.findMany({
      where: { role: "EMPLOYEE", status: { in: ["ACTIVE", "DISABLED"] } },
      orderBy: { name: "asc" },
    }),
    prisma.leaveType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { gte: new Date(Date.UTC(year, 0, 1)) },
        endDate: { lte: new Date(Date.UTC(year, 11, 31)) },
      },
    }),
  ]);

  const usedByUserType = new Map<string, Map<string, number>>();
  for (const req of approvedRequests) {
    if (!usedByUserType.has(req.userId)) usedByUserType.set(req.userId, new Map());
    const m = usedByUserType.get(req.userId)!;
    m.set(req.leaveTypeId, (m.get(req.leaveTypeId) ?? 0) + req.daysCount);
  }

  const rows = employees.map((emp) => {
    const m = usedByUserType.get(emp.id) ?? new Map<string, number>();
    const perType = leaveTypes.map((t) => m.get(t.id) ?? 0);
    const total = perType.reduce((a, b) => a + b, 0);
    return { id: emp.id, name: emp.name, email: emp.email, perType, total };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Leave overview</h1>
          <p className="mt-1 text-neutral-500">
            Approved leave days taken by each employee in {year}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/admin/leave?year=${year - 1}`}
            className="rounded-md px-2 py-1 text-neutral-600 hover:bg-neutral-100"
          >
            ← {year - 1}
          </Link>
          <span className="font-medium text-neutral-900">{year}</span>
          <Link
            href={`/admin/leave?year=${year + 1}`}
            className="rounded-md px-2 py-1 text-neutral-600 hover:bg-neutral-100"
          >
            {year + 1} →
          </Link>
        </div>
      </div>

      <form
        action="/api/admin/leave-export"
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white shadow-sm p-4"
      >
        <div>
          <label className="block text-sm font-medium text-neutral-700">From</label>
          <input
            type="date"
            name="from"
            defaultValue={`${year}-01-01`}
            required
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">To</label>
          <input
            type="date"
            name="to"
            defaultValue={`${year}-12-31`}
            required
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Export to Excel
        </button>
        <p className="w-full text-xs text-neutral-400">
          Downloads an .xlsx with a summary matrix and a full per-request detail sheet
          (all statuses) for the selected range.
        </p>
      </form>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Employee</th>
              {leaveTypes.map((t) => (
                <th key={t.id} className="px-4 py-2 font-medium">
                  {t.name}
                </th>
              ))}
              <th className="px-4 py-2 font-medium">Total</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2">
                  <p className="text-neutral-900">{row.name}</p>
                  <p className="text-xs text-neutral-400">{row.email}</p>
                </td>
                {row.perType.map((days, i) => (
                  <td key={leaveTypes[i].id} className="px-4 py-2 text-neutral-600">
                    {days}
                  </td>
                ))}
                <td className="px-4 py-2 font-medium text-neutral-900">{row.total}</td>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/leave/${row.id}`}
                    className="rounded-md px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                  >
                    View history
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={leaveTypes.length + 3} className="px-4 py-6 text-center text-neutral-400">
                  No employees yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
