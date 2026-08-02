import { prisma } from "@/lib/prisma";

export type DayExcuseReason = "leave" | "holiday" | null;

function toUtcDate(date: Date | string) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function getDayExcuseReason(
  userId: string,
  date: Date | string,
): Promise<DayExcuseReason> {
  const day = toUtcDate(date);

  const [holiday, leave] = await Promise.all([
    prisma.holiday.findUnique({ where: { date: day } }),
    prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: "APPROVED",
        startDate: { lte: day },
        endDate: { gte: day },
      },
    }),
  ]);

  if (holiday) return "holiday";
  if (leave) return "leave";
  return null;
}

export function isFutureDate(date: Date | string) {
  const day = toUtcDate(date);
  const today = toUtcDate(new Date());
  return day > today;
}
