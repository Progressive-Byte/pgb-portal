import { CHART_COLORS } from "./chart-tokens";

export function ChartTooltip({
  active,
  label,
  value,
  suffix = "h",
}: {
  active?: boolean;
  label?: string;
  value?: number;
  suffix?: string;
}) {
  if (!active || value === undefined) return null;

  return (
    <div
      className="rounded-md border bg-white px-3 py-2 text-xs shadow-sm"
      style={{ borderColor: CHART_COLORS.gridline }}
    >
      {label && <p style={{ color: CHART_COLORS.textSecondary }}>{label}</p>}
      <p className="font-medium" style={{ color: CHART_COLORS.textPrimary }}>
        {value}
        {suffix}
      </p>
    </div>
  );
}
