import { prisma } from "@/lib/prisma";
import { LeaveTypesManager } from "@/components/admin/leave-types-manager";

export default async function AdminLeaveTypesPage() {
  const leaveTypes = await prisma.leaveType.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Leave types</h1>
        <p className="mt-1 text-neutral-500">
          Manage the leave types employees can request and their default annual allowance.
        </p>
      </div>

      <LeaveTypesManager leaveTypes={leaveTypes} />
    </div>
  );
}
