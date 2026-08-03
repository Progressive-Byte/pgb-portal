"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, CHART_FONT_SIZE } from "./chart-tokens";
import { ChartTooltip } from "./chart-tooltip";

export type MonthlyHoursDatum = { month: string; hours: number };

function formatMonthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

export function MonthlyHoursChart({ data }: { data: MonthlyHoursDatum[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-neutral-400">
        No data.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -16 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke={CHART_COLORS.gridline} strokeWidth={1} />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonthLabel}
          tick={{ fontSize: CHART_FONT_SIZE, fill: CHART_COLORS.muted }}
          axisLine={{ stroke: CHART_COLORS.baseline }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: CHART_FONT_SIZE, fill: CHART_COLORS.muted }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: CHART_COLORS.gridline, opacity: 0.4 }}
          content={({ active, payload, label }) => (
            <ChartTooltip
              active={active}
              label={typeof label === "string" ? formatMonthLabel(label) : undefined}
              value={payload?.[0]?.value as number | undefined}
            />
          )}
        />
        <Bar dataKey="hours" fill={CHART_COLORS.series} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
