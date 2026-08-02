import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminEmployeeReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ from?: string; to?: string; taskTypeId?: string; projectId?: string }>;
}) {
  const { userId } = await params;
  const { from, to, taskTypeId, projectId } = await searchParams;

  const [user, taskTypes, projects] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.taskType.findMany({ orderBy: { name: "asc" } }),
    prisma.projectProduct.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!user) {
    notFound();
  }

  const reports = await prisma.taskReport.findMany({
    where: {
      userId,
      ...(from ? { date: { gte: new Date(from) } } : {}),
      ...(to ? { date: { lte: new Date(to) } } : {}),
      ...(taskTypeId ? { taskTypeId } : {}),
      ...(projectId ? { projectId } : {}),
    },
    include: { taskType: true, project: true },
    orderBy: { date: "desc" },
  });

  const totalHours = reports.reduce((sum, r) => sum + Number(r.hoursWorked), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{user.name}</h1>
        <p className="mt-1 text-neutral-500">
          {user.email} · {reports.length} entries · {totalHours}h total
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">From</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">To</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Task type</label>
          <select
            name="taskTypeId"
            defaultValue={taskTypeId ?? ""}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {taskTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Project</label>
          <select
            name="projectId"
            defaultValue={projectId ?? ""}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Task</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Project</th>
              <th className="px-4 py-2 font-medium">Hours</th>
              <th className="px-4 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {reports.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-neutral-600">{r.date.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2 text-neutral-900">{r.taskName}</td>
                <td className="px-4 py-2 text-neutral-600">{r.taskType.name}</td>
                <td className="px-4 py-2 text-neutral-600">{r.project.name}</td>
                <td className="px-4 py-2 text-neutral-600">{Number(r.hoursWorked)}</td>
                <td className="max-w-xs truncate px-4 py-2 text-neutral-500">{r.notes}</td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  No entries for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
