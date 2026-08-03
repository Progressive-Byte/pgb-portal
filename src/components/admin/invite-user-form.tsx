"use client";

import { useRef, useState, useTransition } from "react";
import { inviteUser } from "@/app/(app)/admin/users/actions";

export function InviteUserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [role, setRole] = useState<"EMPLOYEE" | "ADMIN">("EMPLOYEE");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await inviteUser(formData);
      if (result.ok) {
        setSuccess("Invite sent.");
        formRef.current?.reset();
        setRole("EMPLOYEE");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="grid grid-cols-1 gap-3 rounded-lg border border-neutral-200 bg-white shadow-sm p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
    >
      <div>
        <label className="block text-sm font-medium text-neutral-700">Name</label>
        <input
          name="name"
          required
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">Email</label>
        <input
          type="email"
          name="email"
          required
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">Role</label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as "EMPLOYEE" | "ADMIN")}
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="EMPLOYEE">Employee</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Title {role === "EMPLOYEE" && <span className="text-neutral-400">(admins only)</span>}
        </label>
        <input
          name="title"
          disabled={role === "EMPLOYEE"}
          placeholder="e.g. HR Manager"
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100 disabled:text-neutral-400"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {isPending ? "Sending…" : "Send invite"}
        </button>
      </div>

      {error && (
        <p className="col-span-full text-sm text-red-600">{error}</p>
      )}
      {success && (
        <p className="col-span-full text-sm text-green-600">{success}</p>
      )}
    </form>
  );
}
