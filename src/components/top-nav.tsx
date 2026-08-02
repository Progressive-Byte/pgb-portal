import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

const EMPLOYEE_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leave", label: "Leave" },
  { href: "/reports", label: "Reports" },
  { href: "/policies", label: "Policies" },
];

const ADMIN_LINKS = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/leave-requests", label: "Leave Requests" },
  { href: "/admin/leave-types", label: "Leave Types" },
  { href: "/admin/task-types", label: "Task Types" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/holidays", label: "Holidays" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/policies", label: "Policies" },
];

export function TopNav({
  name,
  role,
}: {
  name: string;
  role: "ADMIN" | "EMPLOYEE";
}) {
  const links = role === "ADMIN" ? ADMIN_LINKS : EMPLOYEE_LINKS;

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-neutral-900">PGB Portal</span>
          <nav className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">{name}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
