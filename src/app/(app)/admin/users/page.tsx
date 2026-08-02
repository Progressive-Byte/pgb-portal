import { prisma } from "@/lib/prisma";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const rows = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title,
    status: user.status,
    joinDate: user.joinDate.toISOString().slice(0, 10),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Users</h1>
        <p className="mt-1 text-neutral-500">
          Invite employees and admins, manage outstanding invites, and enable
          or disable accounts.
        </p>
      </div>

      <InviteUserForm />
      <UsersTable users={rows} />
    </div>
  );
}
