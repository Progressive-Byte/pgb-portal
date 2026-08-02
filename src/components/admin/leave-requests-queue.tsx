"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  approveLeaveRequest,
  rejectLeaveRequest,
} from "@/app/(app)/admin/leave-requests/actions";

type PendingRequest = {
  id: string;
  userId: string;
  employeeName: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
};

export function LeaveRequestsQueue({ requests }: { requests: PendingRequest[] }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleReview(id: string, action: "approve" | "reject") {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const note = notes[id]?.trim() || null;
      const result =
        action === "approve"
          ? await approveLeaveRequest(id, note)
          : await rejectLeaveRequest(id, note);
      if (!result.ok) setError(result.error);
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {requests.map((req) => {
        const rowPending = isPending && pendingId === req.id;
        return (
          <div key={req.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link
                  href={`/admin/leave/${req.userId}`}
                  className="font-medium text-neutral-900 hover:underline"
                >
                  {req.employeeName}
                </Link>
                <p className="text-sm text-neutral-500">
                  {req.leaveTypeName} · {req.startDate} → {req.endDate} · {req.daysCount} day
                  {req.daysCount === 1 ? "" : "s"}
                </p>
                <p className="mt-1 max-w-xl text-sm text-neutral-600">{req.reason}</p>
              </div>
              <div className="flex min-w-[220px] flex-1 flex-col gap-2 sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Optional note"
                  value={notes[req.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [req.id]: e.target.value }))}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    disabled={rowPending}
                    onClick={() => handleReview(req.id, "approve")}
                    className="flex-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    disabled={rowPending}
                    onClick={() => handleReview(req.id, "reject")}
                    className="flex-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {requests.length === 0 && (
        <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-center text-neutral-400">
          No pending leave requests.
        </p>
      )}
    </div>
  );
}
