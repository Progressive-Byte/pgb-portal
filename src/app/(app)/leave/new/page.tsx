import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { getLeaveBalanceSummary } from "@/lib/leave";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";

export default async function NewLeaveRequestPage() {
  const session = await requireUser();

  const [leaveTypes, balances] = await Promise.all([
    prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getLeaveBalanceSummary(session.user.id, new Date().getFullYear()),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">New leave request</h1>
        <p className="mt-1 text-neutral-500">
          Past dates are allowed for after-the-fact submissions.
        </p>
      </div>

      <LeaveRequestForm leaveTypes={leaveTypes} balances={balances} />
    </div>
  );
}
