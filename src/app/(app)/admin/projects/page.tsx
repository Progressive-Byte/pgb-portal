import { prisma } from "@/lib/prisma";
import { SimpleListManager } from "@/components/admin/simple-list-manager";
import { createProject, setProjectActive, updateProject } from "./actions";

export default async function AdminProjectsPage() {
  const projects = await prisma.projectProduct.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Projects / Products</h1>
        <p className="mt-1 text-neutral-500">
          Manage the projects/products employees can select when logging work.
        </p>
      </div>

      <SimpleListManager
        items={projects}
        entityLabel="project/product"
        createAction={createProject}
        updateAction={updateProject}
        setActiveAction={setProjectActive}
      />
    </div>
  );
}
