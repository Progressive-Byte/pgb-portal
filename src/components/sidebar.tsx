import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { SidebarNav, type NavSection } from "@/components/sidebar-nav";

const EMPLOYEE_SECTIONS: NavSection[] = [
  {
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/leave", label: "Leave" },
      { href: "/reports", label: "Reports" },
      { href: "/policies", label: "Policies" },
    ],
  },
];

const ADMIN_SECTIONS: NavSection[] = [
  { links: [{ href: "/admin", label: "Dashboard" }] },
  { title: "People", links: [{ href: "/admin/users", label: "Users" }] },
  {
    title: "Leave",
    links: [
      { href: "/admin/leave-requests", label: "Leave Requests" },
      { href: "/admin/leave-types", label: "Leave Types" },
    ],
  },
  {
    title: "Task Reporting",
    links: [
      { href: "/admin/reports", label: "Reports" },
      { href: "/admin/task-types", label: "Task Types" },
      { href: "/admin/projects", label: "Projects" },
      { href: "/admin/holidays", label: "Holidays" },
    ],
  },
  { title: "Content", links: [{ href: "/admin/policies", label: "Policies" }] },
];

export function Sidebar({
  name,
  role,
}: {
  name: string;
  role: "ADMIN" | "EMPLOYEE";
}) {
  const sections = role === "ADMIN" ? ADMIN_SECTIONS : EMPLOYEE_SECTIONS;
  const homeHref = role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-neutral-200 bg-white">
      <Link href={homeHref} className="border-b border-neutral-200 px-5 py-4">
        <span className="text-lg font-semibold text-neutral-900">PGB Portal</span>
      </Link>

      <SidebarNav sections={sections} />

      <div className="border-t border-neutral-200 px-3 py-3">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900">{name}</p>
            <p className="text-xs text-neutral-400">{role === "ADMIN" ? "Admin" : "Employee"}</p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
