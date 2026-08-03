"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getDayInfo, submitDailyReports, type DayInfo } from "@/app/(app)/reports/actions";

type Option = { id: string; name: string };

type Entry = {
  taskName: string;
  taskTypeId: string;
  projectId: string;
  hoursWorked: string;
  notes: string;
  linksText: string;
};

function emptyEntry(defaultTaskTypeId: string, defaultProjectId: string): Entry {
  return {
    taskName: "",
    taskTypeId: defaultTaskTypeId,
    projectId: defaultProjectId,
    hoursWorked: "",
    notes: "",
    linksText: "",
  };
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export function TaskReportForm({
  taskTypes,
  projects,
  initialDate,
}: {
  taskTypes: Option[];
  projects: Option[];
  initialDate?: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate ?? todayStr());
  const [dayInfo, setDayInfo] = useState<DayInfo | null>(null);
  const [entries, setEntries] = useState<Entry[]>([
    emptyEntry(taskTypes[0]?.id ?? "", projects[0]?.id ?? ""),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isLoading = loadedDate !== date;

  useEffect(() => {
    let cancelled = false;
    getDayInfo(date).then((info) => {
      if (cancelled) return;
      setDayInfo(info);
      setSuccess(null);
      if (info.entries.length > 0) {
        setEntries(
          info.entries.map((e) => ({
            taskName: e.taskName,
            taskTypeId: e.taskTypeId,
            projectId: e.projectId,
            hoursWorked: e.hoursWorked,
            notes: e.notes,
            linksText: e.links.join(", "),
          })),
        );
      } else {
        setEntries([emptyEntry(taskTypes[0]?.id ?? "", projects[0]?.id ?? "")]);
      }
      setLoadedDate(date);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function updateEntry(index: number, patch: Partial<Entry>) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function addEntry() {
    setEntries((prev) => [...prev, emptyEntry(taskTypes[0]?.id ?? "", projects[0]?.id ?? "")]);
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = entries.map((entry) => ({
      taskName: entry.taskName,
      taskTypeId: entry.taskTypeId,
      projectId: entry.projectId,
      hoursWorked: entry.hoursWorked,
      notes: entry.notes,
      links: entry.linksText
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
    }));

    startTransition(async () => {
      const result = await submitDailyReports(date, payload);
      if (result.ok) {
        setSuccess("Saved.");
        router.push("/reports");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
        <label className="block text-sm font-medium text-neutral-700">Date</label>
        <input
          type="date"
          value={date}
          max={todayStr()}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      {isLoading ? (
        <p className="text-neutral-400">Loading…</p>
      ) : dayInfo?.excuseReason ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
          {dayInfo.excuseReason === "leave"
            ? "You are on approved leave this day — no report needed."
            : "This day is a company holiday — no report needed."}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {entries.map((entry, index) => (
            <div key={index} className="space-y-3 rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-700">Task {index + 1}</p>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(index)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Task name</label>
                <input
                  required
                  value={entry.taskName}
                  onChange={(e) => updateEntry(index, { taskName: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Task type</label>
                  <select
                    required
                    value={entry.taskTypeId}
                    onChange={(e) => updateEntry(index, { taskTypeId: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {taskTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">
                    Project / Product
                  </label>
                  <select
                    required
                    value={entry.projectId}
                    onChange={(e) => updateEntry(index, { projectId: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Hours worked</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  required
                  value={entry.hoursWorked}
                  onChange={(e) => updateEntry(index, { hoursWorked: e.target.value })}
                  className="mt-1 block w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Notes</label>
                <textarea
                  required
                  rows={2}
                  value={entry.notes}
                  onChange={(e) => updateEntry(index, { notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Links <span className="text-neutral-400">(optional, comma-separated)</span>
                </label>
                <input
                  value={entry.linksText}
                  onChange={(e) => updateEntry(index, { linksText: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addEntry}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            + Add another task
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Submit"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
