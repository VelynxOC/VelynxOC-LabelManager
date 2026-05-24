export const DEFAULT_PREVIEW_DPI = 96;
export const DEFAULT_LABEL_WIDTH_MM = 100;
export const DEFAULT_LABEL_HEIGHT_MM = 50;

export function mmToPx(mm: number, dpi = DEFAULT_PREVIEW_DPI): number {
  return (mm / 25.4) * dpi;
}

export function pxToMm(px: number, dpi = DEFAULT_PREVIEW_DPI): number {
  return (px / dpi) * 25.4;
}

export function mmToDots(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}
