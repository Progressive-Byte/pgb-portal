import { prisma } from "@/lib/prisma";
import { AdminLeaveEntryForm } from "@/components/admin/admin-leave-entry-form";

export default async function AdminLeaveEntryPage() {
  const [employees, leaveTypes] = await Promise.all([
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Log leave for an employee</h1>
        <p className="mt-1 text-neutral-500">
          For after-the-fact absences the employee never filed a request for.
        </p>
      </div>

      <AdminLeaveEntryForm employees={employees} leaveTypes={leaveTypes} />
    </div>
  );
}
