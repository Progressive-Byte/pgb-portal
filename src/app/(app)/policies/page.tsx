import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function PoliciesPage() {
  const policies = await prisma.policyDocument.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  const byCategory = new Map<string, typeof policies>();
  for (const policy of policies) {
    const list = byCategory.get(policy.category) ?? [];
    list.push(policy);
    byCategory.set(policy.category, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Policies</h1>
        <p className="mt-1 text-neutral-500">Company policy documents, maintained in Google Docs.</p>
      </div>

      {policies.length === 0 && (
        <p className="rounded-lg border border-neutral-200 bg-white shadow-sm px-4 py-6 text-center text-neutral-400">
          No policy documents have been added yet.
        </p>
      )}

      {[...byCategory.entries()].map(([category, docs]) => (
        <div key={category}>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            {category}
          </h2>
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            {docs.map((doc) => (
              <Link
                key={doc.id}
                href={`/policies/${doc.id}`}
                className="block border-b border-neutral-100 px-4 py-3 text-sm text-neutral-900 last:border-b-0 hover:bg-neutral-50"
              >
                {doc.title}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
