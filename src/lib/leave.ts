import { prisma } from "@/lib/prisma";
import { getWorkweekConfig, countWorkdays } from "@/lib/workweek";

/** Counts working days (per the configured weekend pattern) between two dates, inclusive. */
export async function countLeaveDays(start: Date, end: Date): Promise<number> {
  const config = await getWorkweekConfig();
  return countWorkdays(start, end, config);
}

export type LeaveBalanceSummary = {
  leaveTypeId: string;
  leaveTypeName: string;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
  isOverridden: boolean;
};

export async function getLeaveBalanceSummary(
  userId: string,
  year: number,
): Promise<LeaveBalanceSummary[]> {
  const [leaveTypes, overrides, approvedRequests] = await Promise.all([
    prisma.leaveType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.leaveBalance.findMany({ where: { userId, year } }),
    prisma.leaveRequest.findMany({
      where: {
        userId,
        status: "APPROVED",
        startDate: {
          gte: new Date(Date.UTC(year, 0, 1)),
          lte: new Date(Date.UTC(year, 11, 31)),
        },
      },
    }),
  ]);

  const overrideByType = new Map(overrides.map((o) => [o.leaveTypeId, o.allocatedDays]));
  const usedByType = new Map<string, number>();
  for (const req of approvedRequests) {
    usedByType.set(
      req.leaveTypeId,
      (usedByType.get(req.leaveTypeId) ?? 0) + req.daysCount,
    );
  }

  return leaveTypes.map((type) => {
    const override = overrideByType.get(type.id);
    const allocatedDays = override ?? type.defaultAnnualDays;
    const usedDays = usedByType.get(type.id) ?? 0;
    return {
      leaveTypeId: type.id,
      leaveTypeName: type.name,
      allocatedDays,
      usedDays,
      remainingDays: allocatedDays - usedDays,
      isOverridden: override !== undefined,
    };
  });
}
