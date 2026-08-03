import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMissingReportSummary } from "@/lib/reports";

export default async function AdminDashboardPage() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [pendingCount, onLeaveToday, employeeCount, missingToday] = await Promise.all([
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
      },
      include: { user: true, leaveType: true },
    }),
    prisma.user.count({ where: { role: "EMPLOYEE", status: "ACTIVE" } }),
    getMissingReportSummary(today, today),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Admin dashboard</h1>
        <p className="mt-1 text-neutral-500">{todayStr}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/leave-requests"
          className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4 hover:bg-neutral-50"
        >
          <p className="text-sm font-medium text-neutral-500">Pending leave requests</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">{pendingCount}</p>
        </Link>
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
          <p className="text-sm font-medium text-neutral-500">Active employees</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">{employeeCount}</p>
        </div>
        <Link
          href="/admin/reports"
          className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4 hover:bg-neutral-50"
        >
          <p className="text-sm font-medium text-neutral-500">Missing reports today</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">{missingToday.length}</p>
        </Link>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
          On leave today
        </h2>
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          {onLeaveToday.map((lr) => (
            <div
              key={lr.id}
              className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 text-sm last:border-b-0"
            >
              <span className="text-neutral-900">{lr.user.name}</span>
              <span className="text-neutral-500">{lr.leaveType.name}</span>
            </div>
          ))}
          {onLeaveToday.length === 0 && (
            <p className="px-4 py-4 text-center text-sm text-neutral-400">
              No one is on approved leave today.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
