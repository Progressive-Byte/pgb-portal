import { prisma } from "@/lib/prisma";
import { PoliciesManager } from "@/components/admin/policies-manager";

export default async function AdminPoliciesPage() {
  const policies = await prisma.policyDocument.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Policy documents</h1>
        <p className="mt-1 text-neutral-500">
          Manage links to published Google Docs. Editing still happens in Google Docs
          itself — this list controls what employees see and in what order.
        </p>
      </div>

      <PoliciesManager policies={policies} />
    </div>
  );
}
