"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLeaveRequestByAdmin } from "@/app/(app)/admin/leave-requests/actions";

type Employee = { id: string; name: string; email: string };
type LeaveType = { id: string; name: string };

export function AdminLeaveEntryForm({
  employees,
  leaveTypes,
}: {
  employees: Employee[];
  leaveTypes: LeaveType[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createLeaveRequestByAdmin(formData);
      if (result.ok) {
        router.push("/admin/leave-requests");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="max-w-xl space-y-4 rounded-lg border border-neutral-200 bg-white shadow-sm p-6"
    >
      <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
        This entry is auto-approved immediately — use it when an employee was absent
        and never got around to submitting their own request.
      </p>

      <div>
        <label className="block text-sm font-medium text-neutral-700">Employee</label>
        <select
          name="userId"
          required
          defaultValue=""
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select an employee
          </option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} ({emp.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">Leave type</label>
        <select
          name="leaveTypeId"
          required
          defaultValue=""
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a leave type
          </option>
          {leaveTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Start date</label>
          <input
            type="date"
            name="startDate"
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">End date</label>
          <input
            type="date"
            name="endDate"
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">Reason</label>
        <textarea
          name="reason"
          required
          rows={4}
          placeholder="e.g. Employee was out sick on these dates and didn't file a request"
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Log approved leave"}
      </button>
    </form>
  );
}
