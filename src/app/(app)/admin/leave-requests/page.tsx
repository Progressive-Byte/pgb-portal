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
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Leave requests</h1>
        <p className="mt-1 text-neutral-500">
          {rows.length} pending request{rows.length === 1 ? "" : "s"}.
        </p>
      </div>

      <LeaveRequestsQueue requests={rows} />
    </div>
  );
}
