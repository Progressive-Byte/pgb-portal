"use client";

import { useState, useTransition } from "react";
import {
  resendInvite,
  revokeInvite,
  setUserStatus,
} from "@/app/(app)/admin/users/actions";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  title: string | null;
  status: "INVITED" | "ACTIVE" | "DISABLED";
  joinDate: string;
};

const STATUS_STYLES: Record<UserRow["status"], string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INVITED: "bg-amber-100 text-amber-700",
  DISABLED: "bg-neutral-200 text-neutral-600",
};

export function UsersTable({ users }: { users: UserRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(id: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Something went wrong");
      }
      setPendingId(null);
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      {error && (
        <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-50 text-left text-neutral-500">
          <tr>
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium">Role</th>
            <th className="px-4 py-2 font-medium">Title</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Joined</th>
            <th className="px-4 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {users.map((user) => {
            const rowPending = isPending && pendingId === user.id;
            return (
              <tr key={user.id}>
                <td className="px-4 py-2 text-neutral-900">{user.name}</td>
                <td className="px-4 py-2 text-neutral-600">{user.email}</td>
                <td className="px-4 py-2 text-neutral-600">{user.role}</td>
                <td className="px-4 py-2 text-neutral-600">{user.title ?? "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[user.status]}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-neutral-500">{user.joinDate}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    {user.status === "INVITED" && (
                      <>
                        <button
                          disabled={rowPending}
                          onClick={() => run(user.id, () => resendInvite(user.id))}
                          className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                        >
                          Resend
                        </button>
                        <button
                          disabled={rowPending}
                          onClick={() => run(user.id, () => revokeInvite(user.id))}
                          className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      </>
                    )}
                    {user.status === "ACTIVE" && (
                      <button
                        disabled={rowPending}
                        onClick={() => run(user.id, () => setUserStatus(user.id, "DISABLED"))}
                        className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Disable
                      </button>
                    )}
                    {user.status === "DISABLED" && (
                      <button
                        disabled={rowPending}
                        onClick={() => run(user.id, () => setUserStatus(user.id, "ACTIVE"))}
                        className="rounded-md px-2 py-1 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50"
                      >
                        Enable
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {users.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-neutral-400">
                No users yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
