"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, CHART_FONT_SIZE } from "./chart-tokens";
import { ChartTooltip } from "./chart-tooltip";

export type HoursTrendDatum = { date: string; hours: number };

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function HoursTrendChart({ data }: { data: HoursTrendDatum[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-neutral-400">
        No data.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -16 }}>
        <CartesianGrid
          vertical={false}
          stroke={CHART_COLORS.gridline}
          strokeWidth={1}
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateLabel}
          tick={{ fontSize: CHART_FONT_SIZE, fill: CHART_COLORS.muted }}
          axisLine={{ stroke: CHART_COLORS.baseline }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: CHART_FONT_SIZE, fill: CHART_COLORS.muted }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ stroke: CHART_COLORS.baseline, strokeWidth: 1 }}
          content={({ active, payload, label }) => (
            <ChartTooltip
              active={active}
              label={typeof label === "string" ? formatDateLabel(label) : undefined}
              value={payload?.[0]?.value as number | undefined}
            />
          )}
        />
        <Area
          type="monotone"
          dataKey="hours"
          stroke={CHART_COLORS.series}
          strokeWidth={2}
          fill={CHART_COLORS.series}
          fillOpacity={0.1}
          activeDot={{ r: 4, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
