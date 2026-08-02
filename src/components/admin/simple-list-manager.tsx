"use client";

import { useState, useTransition } from "react";

type Item = { id: string; name: string; isActive: boolean };
type ActionResult = { ok: true } | { ok: false; error: string };

export function SimpleListManager({
  items,
  entityLabel,
  createAction,
  updateAction,
  setActiveAction,
}: {
  items: Item[];
  entityLabel: string;
  createAction: (formData: FormData) => Promise<ActionResult>;
  updateAction: (id: string, formData: FormData) => Promise<ActionResult>;
  setActiveAction: (id: string, isActive: boolean) => Promise<ActionResult>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createAction(formData);
      if (!result.ok) setError(result.error);
    });
  }

  function handleUpdate(id: string, formData: FormData) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await updateAction(id, formData);
      if (result.ok) {
        setEditingId(null);
      } else {
        setError(result.error);
      }
      setBusyId(null);
    });
  }

  function toggleActive(id: string, isActive: boolean) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await setActiveAction(id, isActive);
      if (!result.ok) setError(result.error);
      setBusyId(null);
    });
  }

  return (
    <div className="space-y-4">
      <form
        action={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <div>
          <label className="block text-sm font-medium text-neutral-700">Name</label>
          <input
            name="name"
            required
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          Add {entityLabel}
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
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((item) =>
              editingId === item.id ? (
                <tr key={item.id}>
                  <td className="px-4 py-2" colSpan={3}>
                    <form
                      action={(fd) => handleUpdate(item.id, fd)}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input
                        name="name"
                        defaultValue={item.name}
                        required
                        className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={isPending && busyId === item.id}
                        className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-md px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                      >
                        Cancel
                      </button>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={item.id}>
                  <td className="px-4 py-2 text-neutral-900">{item.name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(item.id)}
                        className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                      >
                        Edit
                      </button>
                      <button
                        disabled={isPending && busyId === item.id}
                        onClick={() => toggleActive(item.id, !item.isActive)}
                        className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                      >
                        {item.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-400">
                  None yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
