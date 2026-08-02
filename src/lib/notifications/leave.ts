import { prisma } from "@/lib/prisma";
import { sendMail, escapeHtml } from "@/lib/mail";
import { sendPumbleMessage } from "@/lib/pumble";

type LeaveRequestForNotify = {
  id: string;
  startDate: Date;
  endDate: Date;
  daysCount: number;
  reason: string;
  reviewNote: string | null;
  user: { name: string; email: string };
  leaveType: { name: string };
};

function formatDateRange(startDate: Date, endDate: Date) {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return startDate.getTime() === endDate.getTime()
    ? fmt(startDate)
    : `${fmt(startDate)} to ${fmt(endDate)}`;
}

export async function notifyLeaveSubmitted(request: LeaveRequestForNotify) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { email: true },
  });

  const dateRange = formatDateRange(request.startDate, request.endDate);
  const subject = `Leave request from ${request.user.name}`;
  const html = `<p>${escapeHtml(request.user.name)} submitted a ${escapeHtml(request.leaveType.name)} leave request for ${dateRange} (${request.daysCount} day${request.daysCount === 1 ? "" : "s"}).</p><p><strong>Reason:</strong> ${escapeHtml(request.reason)}</p><p>Review it in the portal under Leave Requests.</p>`;

  await Promise.all(
    admins.map((admin) => sendMail({ to: admin.email, subject, html })),
  );

  await sendPumbleMessage(
    process.env.PUMBLE_WEBHOOK_HR_ADMIN,
    `📋 *${request.user.name}* submitted a *${request.leaveType.name}* leave request for ${dateRange} (${request.daysCount} day${request.daysCount === 1 ? "" : "s"}). Reason: ${request.reason}`,
  );
}

export async function notifyLeaveApproved(request: LeaveRequestForNotify) {
  const dateRange = formatDateRange(request.startDate, request.endDate);

  await sendMail({
    to: request.user.email,
    subject: "Your leave request was approved",
    html: `<p>Your ${escapeHtml(request.leaveType.name)} leave request for ${dateRange} has been approved.</p>${
      request.reviewNote ? `<p><strong>Note:</strong> ${escapeHtml(request.reviewNote)}</p>` : ""
    }`,
  });

  await sendPumbleMessage(
    process.env.PUMBLE_WEBHOOK_GENERAL,
    `🌴 *${request.user.name}* is on ${request.leaveType.name} leave: ${dateRange}.`,
  );
}

export async function notifyLeaveRejected(request: LeaveRequestForNotify) {
  const dateRange = formatDateRange(request.startDate, request.endDate);

  await sendMail({
    to: request.user.email,
    subject: "Your leave request was not approved",
    html: `<p>Your ${escapeHtml(request.leaveType.name)} leave request for ${dateRange} was not approved.</p>${
      request.reviewNote ? `<p><strong>Note:</strong> ${escapeHtml(request.reviewNote)}</p>` : ""
    }`,
  });
}
