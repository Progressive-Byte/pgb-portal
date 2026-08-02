import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Welcome, {session?.user.name}
      </h1>
      <p className="mt-2 text-neutral-500">
        Your leave balance and recent task reports will appear here.
      </p>
    </div>
  );
}
