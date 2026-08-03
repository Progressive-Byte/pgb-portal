"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cancelLeaveRequest } from "@/app/(app)/leave/actions";

type LeaveRequestRow = {
  id: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewNote: string | null;
};

const STATUS_STYLES: Record<LeaveRequestRow["status"], string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-neutral-200 text-neutral-600",
};

export function LeaveHistoryTable({
  requests,
  showActions = true,
}: {
  requests: LeaveRequestRow[];
  showActions?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCancel(id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await cancelLeaveRequest(id);
      if (!result.ok) setError(result.error);
      setPendingId(null);
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
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Dates</th>
            <th className="px-4 py-2 font-medium">Days</th>
            <th className="px-4 py-2 font-medium">Reason</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Note</th>
            {showActions && <th className="px-4 py-2 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {requests.map((req) => {
            const rowPending = isPending && pendingId === req.id;
            return (
              <tr key={req.id}>
                <td className="px-4 py-2 text-neutral-900">{req.leaveTypeName}</td>
                <td className="px-4 py-2 text-neutral-600">
                  {req.startDate} → {req.endDate}
                </td>
                <td className="px-4 py-2 text-neutral-600">{req.daysCount}</td>
                <td className="max-w-xs truncate px-4 py-2 text-neutral-600">{req.reason}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[req.status]}`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="max-w-xs truncate px-4 py-2 text-neutral-500">
                  {req.reviewNote ?? "—"}
                </td>
                {showActions && (
                  <td className="px-4 py-2">
                    {req.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Link
                          href={`/leave/${req.id}/edit`}
                          className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                        >
                          Edit
                        </Link>
                        <button
                          disabled={rowPending}
                          onClick={() => handleCancel(req.id)}
                          className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
          {requests.length === 0 && (
            <tr>
              <td colSpan={showActions ? 7 : 6} className="px-4 py-6 text-center text-neutral-400">
                No leave requests yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
