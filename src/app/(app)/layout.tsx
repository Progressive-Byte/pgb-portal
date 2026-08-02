import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TopNav } from "@/components/top-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-neutral-50">
      <TopNav name={session.user.name ?? session.user.email ?? ""} role={session.user.role} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
