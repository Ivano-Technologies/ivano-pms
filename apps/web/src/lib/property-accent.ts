/** Stable accent hues for property switcher / command bar (per ux-tokens §4). */
const PROPERTY_ACCENT_COLORS = [
  "#0F766E",
  "#2563EB",
  "#B45309",
  "#7C3AED",
  "#DB2777",
  "#0891B2",
  "#65A30D",
  "#C2410C"
] as const;

export function getPropertyAccentColor(propertyId: string): string {
  let hash = 0;
  for (let i = 0; i < propertyId.length; i += 1) {
    hash = (hash * 31 + propertyId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % PROPERTY_ACCENT_COLORS.length;
  return PROPERTY_ACCENT_COLORS[index]!;
}
