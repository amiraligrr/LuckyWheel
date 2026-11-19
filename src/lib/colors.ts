export const PALETTE = [
  "#F87171",
  "#FB923C",
  "#FBBF24",
  "#A3E635",
  "#34D399",
  "#2DD4BF",
  "#38BDF8",
  "#60A5FA",
  "#818CF8",
  "#A78BFA",
  "#E879F9",
  "#F472B6",
] as const;

export type PaletteColor = (typeof PALETTE)[number];

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

/** Relative luminance (WCAG) for a hex colour. */
export function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Pick near-black or white text for a coloured surface. */
export function readableInk(background: string): string {
  return luminance(background) > 0.52 ? "#1A171B" : "#FFFFFF";
}

export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
