"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLeaveRequest, updateLeaveRequest } from "@/app/(app)/leave/actions";

type LeaveType = { id: string; name: string };
type Balance = {
  leaveTypeId: string;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
};

export function LeaveRequestForm({
  leaveTypes,
  balances = [],
  requestId,
  initialValues,
}: {
  leaveTypes: LeaveType[];
  balances?: Balance[];
  requestId?: string;
  initialValues?: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [leaveTypeId, setLeaveTypeId] = useState(initialValues?.leaveTypeId ?? "");

  const selectedBalance = useMemo(
    () => balances.find((b) => b.leaveTypeId === leaveTypeId),
    [balances, leaveTypeId],
  );

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = requestId
        ? await updateLeaveRequest(requestId, formData)
        : await createLeaveRequest(formData);

      if (result.ok) {
        router.push("/leave");
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
      <div>
        <label className="block text-sm font-medium text-neutral-700">Leave type</label>
        <select
          name="leaveTypeId"
          required
          value={leaveTypeId}
          onChange={(e) => setLeaveTypeId(e.target.value)}
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
        {selectedBalance && (
          <p className="mt-1.5 text-xs text-neutral-500">
            <span className="font-medium text-neutral-700">
              {selectedBalance.remainingDays}
            </span>{" "}
            of {selectedBalance.allocatedDays} days remaining this year ({selectedBalance.usedDays}{" "}
            used)
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Start date</label>
          <input
            type="date"
            name="startDate"
            required
            defaultValue={initialValues?.startDate}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">End date</label>
          <input
            type="date"
            name="endDate"
            required
            defaultValue={initialValues?.endDate}
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
          defaultValue={initialValues?.reason}
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {isPending ? "Saving…" : requestId ? "Save changes" : "Submit request"}
      </button>
    </form>
  );
}
