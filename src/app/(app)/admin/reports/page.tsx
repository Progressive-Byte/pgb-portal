import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminReportsIndexPage() {
  const users = await prisma.user.findMany({
    where: { status: { in: ["ACTIVE", "DISABLED"] } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Reports</h1>
        <p className="mt-1 text-neutral-500">Select an employee to view their task report history.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {users.map((user) => (
          <Link
            key={user.id}
            href={`/admin/reports/${user.id}`}
            className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 text-sm last:border-b-0 hover:bg-neutral-50"
          >
            <span className="text-neutral-900">{user.name}</span>
            <span className="text-neutral-400">{user.email}</span>
          </Link>
        ))}
        {users.length === 0 && (
          <p className="px-4 py-6 text-center text-neutral-400">No employees yet.</p>
        )}
      </div>
    </div>
  );
}
