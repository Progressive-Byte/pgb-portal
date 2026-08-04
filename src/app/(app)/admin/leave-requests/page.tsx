import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LeaveRequestsQueue } from "@/components/admin/leave-requests-queue";

export default async function AdminLeaveRequestsPage() {
  const requests = await prisma.leaveRequest.findMany({
    where: { status: "PENDING" },
    include: { user: true, leaveType: true },
    orderBy: { createdAt: "asc" },
  });

  const rows = requests.map((r) => ({
    id: r.id,
    userId: r.userId,
    employeeName: r.user.name,
    leaveTypeName: r.leaveType.name,
    startDate: r.startDate.toISOString().slice(0, 10),
    endDate: r.endDate.toISOString().slice(0, 10),
    daysCount: r.daysCount,
    reason: r.reason,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Leave requests</h1>
          <p className="mt-1 text-neutral-500">
            {rows.length} pending request{rows.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link
          href="/admin/leave-requests/new"
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Log leave for an employee
        </Link>
      </div>

      <LeaveRequestsQueue requests={rows} />
    </div>
  );
}
