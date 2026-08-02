"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, CHART_FONT_SIZE } from "./chart-tokens";
import { ChartTooltip } from "./chart-tooltip";

export type HoursBarDatum = { name: string; hours: number; [key: string]: unknown };

export function HoursBarChart({
  data,
  onBarClick,
}: {
  data: HoursBarDatum[];
  onBarClick?: (datum: HoursBarDatum) => void;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-neutral-400">
        No data.
      </div>
    );
  }

  const height = Math.max(120, data.length * 36 + 24);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 32, bottom: 4, left: 4 }}
        barCategoryGap={6}
      >
        <CartesianGrid
          horizontal={false}
          stroke={CHART_COLORS.gridline}
          strokeWidth={1}
        />
        <XAxis
          type="number"
          tick={{ fontSize: CHART_FONT_SIZE, fill: CHART_COLORS.muted }}
          axisLine={{ stroke: CHART_COLORS.baseline }}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: CHART_FONT_SIZE, fill: CHART_COLORS.textSecondary }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: CHART_COLORS.gridline, opacity: 0.4 }}
          content={({ active, payload }) => (
            <ChartTooltip
              active={active}
              label={payload?.[0]?.payload?.name}
              value={payload?.[0]?.value as number | undefined}
            />
          )}
        />
        <Bar
          dataKey="hours"
          fill={CHART_COLORS.series}
          radius={[0, 4, 4, 0]}
          maxBarSize={20}
          cursor={onBarClick ? "pointer" : undefined}
          onClick={(datum) => onBarClick?.(datum.payload as HoursBarDatum)}
        >
          <LabelList
            dataKey="hours"
            position="right"
            style={{ fontSize: CHART_FONT_SIZE, fill: CHART_COLORS.textSecondary }}
            formatter={(v: React.ReactNode) => `${v}h`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
