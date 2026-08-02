import { prisma } from "@/lib/prisma";
import { SimpleListManager } from "@/components/admin/simple-list-manager";
import { createTaskType, setTaskTypeActive, updateTaskType } from "./actions";

export default async function AdminTaskTypesPage() {
  const taskTypes = await prisma.taskType.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Task types</h1>
        <p className="mt-1 text-neutral-500">
          Manage the task types employees can select when logging work.
        </p>
      </div>

      <SimpleListManager
        items={taskTypes}
        entityLabel="task type"
        createAction={createTaskType}
        updateAction={updateTaskType}
        setActiveAction={setTaskTypeActive}
      />
    </div>
  );
}
