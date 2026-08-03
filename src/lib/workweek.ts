import { prisma } from "@/lib/prisma";

// Used only if no WeekendConfig row exists yet (e.g. right after migration).
const FALLBACK_ANCHOR_OFF_SATURDAY = "2026-01-03";

export type WorkweekConfig = {
  anchorOffSaturday: Date;
  exceptions: Map<string, boolean>; // dateISO -> isOff
};

export function toUtcDate(date: Date | string): Date {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getWorkweekConfig(): Promise<WorkweekConfig> {
  const [configRow, exceptionRows] = await Promise.all([
    prisma.weekendConfig.findUnique({ where: { id: "singleton" } }),
    prisma.weekendException.findMany(),
  ]);

  return {
    anchorOffSaturday: toUtcDate(configRow?.anchorOffSaturday ?? FALLBACK_ANCHOR_OFF_SATURDAY),
    exceptions: new Map(exceptionRows.map((e) => [isoDate(toUtcDate(e.date)), e.isOff])),
  };
}

/** Friday and Sunday are always off. Saturday alternates from the anchor; any
 * date (usually a Saturday) can be overridden by an exception. */
export function isWorkday(date: Date | string, config: WorkweekConfig): boolean {
  const d = toUtcDate(date);
  const dow = d.getUTCDay();
  const key = isoDate(d);
  const exception = config.exceptions.get(key);

  if (exception !== undefined) return !exception;
  if (dow === 0 || dow === 5) return false;

  if (dow === 6) {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diffWeeks = Math.round((d.getTime() - config.anchorOffSaturday.getTime()) / msPerWeek);
    const isOffSaturday = diffWeeks % 2 === 0;
    return !isOffSaturday;
  }

  return true;
}

export function countWorkdays(start: Date | string, end: Date | string, config: WorkweekConfig): number {
  let count = 0;
  const cursor = toUtcDate(start);
  const last = toUtcDate(end);
  while (cursor <= last) {
    if (isWorkday(cursor, config)) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

export function listWorkdays(start: Date | string, end: Date | string, config: WorkweekConfig): Date[] {
  const days: Date[] = [];
  const cursor = toUtcDate(start);
  const last = toUtcDate(end);
  while (cursor <= last) {
    if (isWorkday(cursor, config)) days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export type SaturdayPreview = { date: string; isOff: boolean; isException: boolean };

/** The next `count` Saturdays from `from` (inclusive), with their effective status. */
export function previewSaturdays(
  config: WorkweekConfig,
  count: number,
  from: Date = new Date(),
): SaturdayPreview[] {
  const cursor = toUtcDate(from);
  while (cursor.getUTCDay() !== 6) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const result: SaturdayPreview[] = [];
  for (let i = 0; i < count; i++) {
    const key = isoDate(cursor);
    result.push({
      date: key,
      isOff: !isWorkday(cursor, config),
      isException: config.exceptions.has(key),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return result;
}
