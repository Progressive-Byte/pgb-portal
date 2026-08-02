import { prisma } from "@/lib/prisma";
import { TaskReportForm } from "@/components/reports/task-report-form";

export default async function NewTaskReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;

  const [taskTypes, projects] = await Promise.all([
    prisma.taskType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.projectProduct.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Daily task report</h1>
        <p className="mt-1 text-neutral-500">
          Log every task you worked on for the selected day. Resubmitting replaces the
          day&apos;s entries.
        </p>
      </div>

      <TaskReportForm taskTypes={taskTypes} projects={projects} initialDate={date} />
    </div>
  );
}
