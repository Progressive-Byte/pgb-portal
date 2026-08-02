import { prisma } from "@/lib/prisma";
import { HolidaysManager } from "@/components/admin/holidays-manager";

export default async function AdminHolidaysPage() {
  const holidays = await prisma.holiday.findMany({ orderBy: { date: "asc" } });

  const rows = holidays.map((h) => ({
    id: h.id,
    date: h.date.toISOString().slice(0, 10),
    name: h.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Holidays</h1>
        <p className="mt-1 text-neutral-500">
          Company-wide holidays are excused automatically for every employee&apos;s task
          reports.
        </p>
      </div>

      <HolidaysManager holidays={rows} />
    </div>
  );
}
