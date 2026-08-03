import Link from "next/link";

export function MissingReportsPanel({ dates }: { dates: string[] }) {
  if (dates.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-800">
        {dates.length} day{dates.length === 1 ? "" : "s"} missing a report this month
      </p>
      <p className="mt-0.5 text-xs text-amber-700">
        Submitting a leave request or having the day marked as a holiday will clear it
        from this list.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {dates.map((date) => (
          <Link
            key={date}
            href={`/reports/new?date=${date}`}
            className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs text-amber-800 hover:bg-amber-100"
          >
            {date}
          </Link>
        ))}
      </div>
    </div>
  );
}
