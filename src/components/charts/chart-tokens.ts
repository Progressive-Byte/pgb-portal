// Chart palette — brand green as the single accent for magnitude/trend charts.
// Validated with the dataviz skill's validate_palette.js (contrast >= 3:1 on
// the light surface). See references/palette.md for the full categorical set
// if a multi-series chart is ever needed.
export const CHART_COLORS = {
  series: "#059669", // emerald-600
  textPrimary: "#0b0b0b",
  textSecondary: "#52514e",
  muted: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
  surface: "#fcfcfb",
} as const;

export const CHART_FONT_SIZE = 12;
