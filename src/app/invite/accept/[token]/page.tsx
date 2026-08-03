import { prisma } from "@/lib/prisma";
import { AcceptInviteForm } from "@/components/accept-invite-form";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const inviteToken = await prisma.inviteToken.findUnique({
    where: { token },
    include: { user: true },
  });

  const isValid =
    !!inviteToken &&
    !inviteToken.usedAt &&
    inviteToken.expiresAt > new Date() &&
    inviteToken.user.status === "INVITED";

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white shadow-sm p-8">
        <h1 className="mb-1 text-xl font-semibold text-neutral-900">
          PGB Portal
        </h1>

        {isValid ? (
          <>
            <p className="mb-6 text-sm text-neutral-500">
              Welcome, {inviteToken.user.name}. Set a password to activate your
              account.
            </p>
            <AcceptInviteForm token={token} />
          </>
        ) : (
          <p className="mb-2 text-sm text-red-600">
            This invite link is invalid or has expired. Please contact your
            admin for a new invite.
          </p>
        )}
      </div>
    </div>
  );
}
