"use client";

import { useState, useTransition } from "react";
import {
  createPolicy,
  deletePolicy,
  updatePolicy,
} from "@/app/(app)/admin/policies/actions";

type Policy = {
  id: string;
  title: string;
  category: string;
  embedUrl: string;
  sortOrder: number;
};

function EditRow({ policy, onDone }: { policy: Policy; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updatePolicy(policy.id, formData);
      if (result.ok) {
        onDone();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <tr>
      <td className="px-4 py-2" colSpan={5}>
        <form action={handleSubmit} className="flex flex-wrap items-center gap-2">
          <input
            name="title"
            defaultValue={policy.title}
            required
            placeholder="Title"
            className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
          <input
            name="category"
            defaultValue={policy.category}
            required
            placeholder="Category"
            className="w-32 rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
          <input
            name="embedUrl"
            defaultValue={policy.embedUrl}
            required
            placeholder="Published Google Doc URL"
            className="min-w-[240px] flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            name="sortOrder"
            defaultValue={policy.sortOrder}
            className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-md px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
          >
            Cancel
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </form>
      </td>
    </tr>
  );
}

export function PoliciesManager({ policies }: { policies: Policy[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPolicy(formData);
      if (!result.ok) setError(result.error);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this policy document from the list?")) return;
    setError(null);
    setDeletingId(id);
    startTransition(async () => {
      const result = await deletePolicy(id);
      if (!result.ok) setError(result.error);
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-4">
      <form
        action={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <div>
          <label className="block text-sm font-medium text-neutral-700">Title</label>
          <input
            name="title"
            required
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Category</label>
          <input
            name="category"
            required
            className="mt-1 w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="min-w-[260px] flex-1">
          <label className="block text-sm font-medium text-neutral-700">
            Published Google Doc URL
          </label>
          <input
            name="embedUrl"
            required
            placeholder="https://docs.google.com/document/d/.../pub"
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Order</label>
          <input
            type="number"
            name="sortOrder"
            defaultValue={0}
            className="mt-1 w-20 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          Add document
        </button>
      </form>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">URL</th>
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {policies.map((policy) =>
              editingId === policy.id ? (
                <EditRow key={policy.id} policy={policy} onDone={() => setEditingId(null)} />
              ) : (
                <tr key={policy.id}>
                  <td className="px-4 py-2 text-neutral-900">{policy.title}</td>
                  <td className="px-4 py-2 text-neutral-600">{policy.category}</td>
                  <td className="max-w-xs truncate px-4 py-2 text-neutral-500">
                    {policy.embedUrl}
                  </td>
                  <td className="px-4 py-2 text-neutral-600">{policy.sortOrder}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(policy.id)}
                        className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                      >
                        Edit
                      </button>
                      <button
                        disabled={isPending && deletingId === policy.id}
                        onClick={() => handleDelete(policy.id)}
                        className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
            {policies.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                  No policy documents yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
