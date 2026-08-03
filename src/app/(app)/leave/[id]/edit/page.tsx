import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { getLeaveBalanceSummary } from "@/lib/leave";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";

export default async function EditLeaveRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser();

  const [leaveTypes, request, balances] = await Promise.all([
    prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.leaveRequest.findUnique({ where: { id } }),
    getLeaveBalanceSummary(session.user.id, new Date().getFullYear()),
  ]);

  if (!request || request.userId !== session.user.id || request.status !== "PENDING") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Edit leave request</h1>
        <p className="mt-1 text-neutral-500">Only pending requests can be edited.</p>
      </div>

      <LeaveRequestForm
        leaveTypes={leaveTypes}
        balances={balances}
        requestId={request.id}
        initialValues={{
          leaveTypeId: request.leaveTypeId,
          startDate: request.startDate.toISOString().slice(0, 10),
          endDate: request.endDate.toISOString().slice(0, 10),
          reason: request.reason,
        }}
      />
    </div>
  );
}
