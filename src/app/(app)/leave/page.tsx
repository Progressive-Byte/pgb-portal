import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { getLeaveBalanceSummary } from "@/lib/leave";
import { BalanceSummary } from "@/components/leave/balance-summary";
import { LeaveHistoryTable } from "@/components/leave/leave-history-table";

export default async function LeavePage() {
  const session = await requireUser();
  const year = new Date().getFullYear();

  const [balances, requests] = await Promise.all([
    getLeaveBalanceSummary(session.user.id, year),
    prisma.leaveRequest.findMany({
      where: { userId: session.user.id },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Leave</h1>
          <p className="mt-1 text-neutral-500">Your balance and requests for {year}.</p>
        </div>
        <Link
          href="/leave/new"
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          New leave request
        </Link>
      </div>

      <BalanceSummary balances={balances} />
      <LeaveHistoryTable requests={rows} />
    </div>
  );
}
