"use client";

import { useState, useTransition } from "react";
import { createHoliday, deleteHoliday } from "@/app/(app)/admin/holidays/actions";

type Holiday = { id: string; date: string; name: string };

export function HolidaysManager({ holidays }: { holidays: Holiday[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createHoliday(formData);
      if (!result.ok) setError(result.error);
    });
  }

  function handleDelete(id: string) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await deleteHoliday(id);
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
          <label className="block text-sm font-medium text-neutral-700">Date</label>
          <input
            type="date"
            name="date"
            required
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Name</label>
          <input
            name="name"
            required
            placeholder="e.g. Independence Day"
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          Add holiday
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
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {holidays.map((h) => (
              <tr key={h.id}>
                <td className="px-4 py-2 text-neutral-900">{h.date}</td>
                <td className="px-4 py-2 text-neutral-600">{h.name}</td>
                <td className="px-4 py-2">
                  <button
                    disabled={isPending && busyId === h.id}
                    onClick={() => handleDelete(h.id)}
                    className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {holidays.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-400">
                  No holidays configured.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
