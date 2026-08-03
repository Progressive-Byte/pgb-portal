import Link from "next/link";

export type DayReportEntry = {
  id: string;
  taskName: string;
  taskTypeName: string;
  projectName: string;
  hours: number;
  notes: string;
  links: string[];
};

export type DayReportGroup = {
  date: string;
  entries: DayReportEntry[];
};

export function DayReportCards({
  days,
  editHref,
}: {
  days: DayReportGroup[];
  editHref?: (date: string) => string;
}) {
  if (days.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 bg-white shadow-sm px-4 py-6 text-center text-neutral-400">
        No task reports for this period.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {days.map(({ date, entries }) => {
        const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
        return (
          <div key={date} className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-neutral-900">{date}</p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-500">{totalHours}h total</span>
                {editHref && (
                  <Link
                    href={editHref(date)}
                    className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                  >
                    Edit
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {entries.map((entry) => (
                <div key={entry.id} className="rounded-md border border-neutral-100 bg-neutral-50 p-3">
                  <p className="text-sm font-medium text-neutral-900">{entry.taskName}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {entry.taskTypeName} · {entry.projectName} · {entry.hours}h
                  </p>
                  {entry.notes && <p className="mt-1.5 text-xs text-neutral-600">{entry.notes}</p>}
                  {entry.links.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {entry.links.map((link) => (
                        <a
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-xs text-emerald-700 hover:underline"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
