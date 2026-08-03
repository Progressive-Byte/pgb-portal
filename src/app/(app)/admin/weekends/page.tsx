import { prisma } from "@/lib/prisma";
import { getWorkweekConfig, previewSaturdays } from "@/lib/workweek";
import { WeekendConfigManager } from "@/components/admin/weekend-config-manager";

export default async function AdminWeekendsPage() {
  const [config, exceptionRows] = await Promise.all([
    getWorkweekConfig(),
    prisma.weekendException.findMany({ orderBy: { date: "asc" } }),
  ]);

  const preview = previewSaturdays(config, 8);
  const exceptions = exceptionRows.map((e) => ({
    id: e.id,
    date: e.date.toISOString().slice(0, 10),
    isOff: e.isOff,
    note: e.note,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Weekends</h1>
        <p className="mt-1 text-neutral-500">
          Configure the company weekend pattern used for leave day counts and
          missing-report checks.
        </p>
      </div>

      <WeekendConfigManager
        anchor={config.anchorOffSaturday.toISOString().slice(0, 10)}
        preview={preview}
        exceptions={exceptions}
      />
    </div>
  );
}
