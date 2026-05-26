export const PRINTER_DPI = 203;

/**
 * Escala visual SOLO para preview UI.
 * NO altera medidas reales.
 */
export const PREVIEW_SCALE = 0.45;

export const DEFAULT_LABEL_WIDTH_MM = 100;

export const DEFAULT_LABEL_HEIGHT_MM = 50;

/**
 * Convierte mm a pixels reales Zebra.
 */
export function mmToPx(
  mm: number,
  dpi = PRINTER_DPI
): number {
  return (mm / 25.4) * dpi;
}

/**
 * Convierte pixels a mm reales.
 */
export function pxToMm(
  px: number,
  dpi = PRINTER_DPI
): number {
  return (px / dpi) * 25.4;
}

/**
 * Convierte mm a dots Zebra.
 */
export function mmToDots(
  mm: number,
  dpi = PRINTER_DPI
): number {
  return Math.round((mm / 25.4) * dpi);
}