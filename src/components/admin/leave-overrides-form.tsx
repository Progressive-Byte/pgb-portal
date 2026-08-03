"use client";

import { useState, useTransition } from "react";
import { setLeaveBalanceOverride } from "@/app/(app)/admin/leave/[userId]/actions";

type Row = {
  leaveTypeId: string;
  leaveTypeName: string;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
  isOverridden: boolean;
};

export function LeaveOverridesForm({
  userId,
  year,
  rows,
}: {
  userId: string;
  year: number;
  rows: Row[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);

  function handleSubmit(leaveTypeId: string, formData: FormData) {
    setError(null);
    setSavingId(leaveTypeId);
    formData.set("leaveTypeId", leaveTypeId);
    formData.set("year", String(year));
    startTransition(async () => {
      const result = await setLeaveBalanceOverride(userId, formData);
      if (!result.ok) setError(result.error);
      setSavingId(null);
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
      {error && (
        <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-50 text-left text-neutral-500">
          <tr>
            <th className="px-4 py-2 font-medium">Leave type</th>
            <th className="px-4 py-2 font-medium">Allocated ({year})</th>
            <th className="px-4 py-2 font-medium">Used</th>
            <th className="px-4 py-2 font-medium">Remaining</th>
            <th className="px-4 py-2 font-medium">Override</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={row.leaveTypeId}>
              <td className="px-4 py-2 text-neutral-900">{row.leaveTypeName}</td>
              <td className="px-4 py-2 text-neutral-600">
                {row.allocatedDays}
                {row.isOverridden && (
                  <span className="ml-1 text-xs text-neutral-400">(override)</span>
                )}
              </td>
              <td className="px-4 py-2 text-neutral-600">{row.usedDays}</td>
              <td className="px-4 py-2 text-neutral-600">{row.remainingDays}</td>
              <td className="px-4 py-2">
                <form
                  action={(fd) => handleSubmit(row.leaveTypeId, fd)}
                  className="flex items-center gap-2"
                >
                  <input
                    type="number"
                    name="allocatedDays"
                    min={0}
                    defaultValue={row.allocatedDays}
                    className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isPending && savingId === row.leaveTypeId}
                    className="rounded-md bg-emerald-700 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Save
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
