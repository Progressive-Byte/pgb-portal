"use client";

import { useState, useTransition } from "react";
import {
  removeWeekendException,
  setWeekendAnchor,
  setWeekendException,
} from "@/app/(app)/admin/weekends/actions";
import type { SaturdayPreview } from "@/lib/workweek";

type ExceptionRow = { id: string; date: string; isOff: boolean; note: string | null };

export function WeekendConfigManager({
  anchor,
  preview,
  exceptions,
}: {
  anchor: string;
  preview: SaturdayPreview[];
  exceptions: ExceptionRow[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  function handleSetAnchor(formData: FormData) {
    setError(null);
    setBusyKey("anchor");
    startTransition(async () => {
      const result = await setWeekendAnchor(formData);
      if (!result.ok) setError(result.error);
      setBusyKey(null);
    });
  }

  function togglePreviewRow(row: SaturdayPreview) {
    setError(null);
    setBusyKey(row.date);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("date", row.date);
      fd.set("isOff", String(!row.isOff));
      const result = await setWeekendException(fd);
      if (!result.ok) setError(result.error);
      setBusyKey(null);
    });
  }

  function resetToPattern(date: string) {
    const match = exceptions.find((e) => e.date === date);
    if (!match) return;
    setError(null);
    setBusyKey(date);
    startTransition(async () => {
      const result = await removeWeekendException(match.id);
      if (!result.ok) setError(result.error);
      setBusyKey(null);
    });
  }

  function deleteException(id: string) {
    setError(null);
    setBusyKey(id);
    startTransition(async () => {
      const result = await removeWeekendException(id);
      if (!result.ok) setError(result.error);
      setBusyKey(null);
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
        <p className="text-sm text-neutral-600">
          Friday is always off. Saturdays alternate: every other Saturday counting
          from the anchor date below is off, the rest are working days.
        </p>
        <form action={handleSetAnchor} className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              An off Saturday (anchor)
            </label>
            <input
              type="date"
              name="anchorOffSaturday"
              defaultValue={anchor}
              required
              className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isPending && busyKey === "anchor"}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            Save
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Next 8 Saturdays
        </h2>
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          {preview.map((row) => (
            <div
              key={row.date}
              className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5 text-sm last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-neutral-900">{row.date}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.isOff ? "bg-neutral-200 text-neutral-600" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {row.isOff ? "Off" : "Working"}
                </span>
                {row.isException && (
                  <span className="text-xs text-neutral-400">(override)</span>
                )}
              </div>
              <div className="flex gap-2">
                {row.isException && (
                  <button
                    disabled={isPending && busyKey === row.date}
                    onClick={() => resetToPattern(row.date)}
                    className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                  >
                    Reset to pattern
                  </button>
                )}
                <button
                  disabled={isPending && busyKey === row.date}
                  onClick={() => togglePreviewRow(row)}
                  className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                >
                  Mark as {row.isOff ? "working" : "off"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
          All exceptions
        </h2>
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          {exceptions.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5 text-sm last:border-b-0"
            >
              <div>
                <span className="text-neutral-900">{e.date}</span>{" "}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                    e.isOff ? "bg-neutral-200 text-neutral-600" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {e.isOff ? "Off" : "Working"}
                </span>
                {e.note && <span className="ml-2 text-xs text-neutral-400">{e.note}</span>}
              </div>
              <button
                disabled={isPending && busyKey === e.id}
                onClick={() => deleteException(e.id)}
                className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
          {exceptions.length === 0 && (
            <p className="px-4 py-4 text-center text-sm text-neutral-400">
              No exceptions — every Saturday follows the alternating pattern.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
