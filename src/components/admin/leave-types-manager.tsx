"use client";

import { useState, useTransition } from "react";
import {
  createLeaveType,
  setLeaveTypeActive,
  updateLeaveType,
} from "@/app/(app)/admin/leave-types/actions";

type LeaveType = {
  id: string;
  name: string;
  defaultAnnualDays: number;
  isActive: boolean;
};

function EditRow({ type, onDone }: { type: LeaveType; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateLeaveType(type.id, formData);
      if (result.ok) {
        onDone();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <tr>
      <td className="px-4 py-2" colSpan={4}>
        <form action={handleSubmit} className="flex flex-wrap items-center gap-2">
          <input
            name="name"
            defaultValue={type.name}
            required
            className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            name="defaultAnnualDays"
            defaultValue={type.defaultAnnualDays}
            min={0}
            required
            className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-emerald-700 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
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

export function LeaveTypesManager({ leaveTypes }: { leaveTypes: LeaveType[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createLeaveType(formData);
      if (!result.ok) setError(result.error);
    });
  }

  function toggleActive(id: string, isActive: boolean) {
    setError(null);
    setTogglingId(id);
    startTransition(async () => {
      const result = await setLeaveTypeActive(id, isActive);
      if (!result.ok) setError(result.error);
      setTogglingId(null);
    });
  }

  return (
    <div className="space-y-4">
      <form
        action={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white shadow-sm p-4"
      >
        <div>
          <label className="block text-sm font-medium text-neutral-700">Name</label>
          <input
            name="name"
            required
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Default annual days
          </label>
          <input
            type="number"
            name="defaultAnnualDays"
            min={0}
            required
            className="mt-1 w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          Add leave type
        </button>
      </form>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Default annual days</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {leaveTypes.map((type) =>
              editingId === type.id ? (
                <EditRow key={type.id} type={type} onDone={() => setEditingId(null)} />
              ) : (
                <tr key={type.id}>
                  <td className="px-4 py-2 text-neutral-900">{type.name}</td>
                  <td className="px-4 py-2 text-neutral-600">{type.defaultAnnualDays}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        type.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {type.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(type.id)}
                        className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                      >
                        Edit
                      </button>
                      <button
                        disabled={isPending && togglingId === type.id}
                        onClick={() => toggleActive(type.id, !type.isActive)}
                        className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                      >
                        {type.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
