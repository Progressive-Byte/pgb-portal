import type { LeaveBalanceSummary } from "@/lib/leave";

export function BalanceSummary({ balances }: { balances: LeaveBalanceSummary[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {balances.map((b) => (
        <div key={b.leaveTypeId} className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm font-medium text-neutral-500">{b.leaveTypeName}</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {b.remainingDays}
            <span className="text-sm font-normal text-neutral-400"> / {b.allocatedDays}</span>
          </p>
          <p className="text-xs text-neutral-400">{b.usedDays} used</p>
        </div>
      ))}
    </div>
  );
}
