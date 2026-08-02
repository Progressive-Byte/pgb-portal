import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLeaveBalanceSummary } from "@/lib/leave";
import { LeaveOverridesForm } from "@/components/admin/leave-overrides-form";
import { LeaveHistoryTable } from "@/components/leave/leave-history-table";

export default async function AdminEmployeeLeavePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const year = new Date().getFullYear();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    notFound();
  }

  const [balances, requests] = await Promise.all([
    getLeaveBalanceSummary(userId, year),
    prisma.leaveRequest.findMany({
      where: { userId },
      include: { leaveType: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const rows = requests.map((r) => ({
    id: r.id,
    leaveTypeName: r.leaveType.name,
    startDate: r.startDate.toISOString().slice(0, 10),
    endDate: r.endDate.toISOString().slice(0, 10),
    daysCount: r.daysCount,
    reason: r.reason,
    status: r.status,
    reviewNote: r.reviewNote,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{user.name}</h1>
        <p className="mt-1 text-neutral-500">
          {user.email} · Leave balances and history for {year}.
        </p>
      </div>

      <LeaveOverridesForm userId={userId} year={year} rows={balances} />

      <div>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">History</h2>
        <LeaveHistoryTable requests={rows} showActions={false} />
      </div>
    </div>
  );
}
