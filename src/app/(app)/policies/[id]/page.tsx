import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PolicyViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const policy = await prisma.policyDocument.findUnique({ where: { id } });

  if (!policy) {
    notFound();
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col space-y-4">
      <div>
        <Link href="/policies" className="text-sm text-neutral-500 hover:underline">
          ← Policies
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900">{policy.title}</h1>
      </div>

      <iframe
        src={policy.embedUrl}
        title={policy.title}
        className="w-full flex-1 rounded-lg border border-neutral-200 bg-white"
      />
    </div>
  );
}
