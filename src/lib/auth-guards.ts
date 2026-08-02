import { auth } from "@/lib/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
  return session;
}

export async function requireUser() {
  const session = await auth();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session;
}
