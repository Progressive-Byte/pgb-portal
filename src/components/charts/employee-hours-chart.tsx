"use client";

import { useRouter } from "next/navigation";
import { HoursBarChart, type HoursBarDatum } from "./hours-bar-chart";

export function EmployeeHoursChart({
  data,
}: {
  data: { userId: string; name: string; hours: number }[];
}) {
  const router = useRouter();

  return (
    <HoursBarChart
      data={data}
      onBarClick={(datum: HoursBarDatum) => router.push(`/admin/reports/${datum.userId}`)}
    />
  );
}
