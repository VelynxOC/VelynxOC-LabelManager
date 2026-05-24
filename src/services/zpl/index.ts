import type { CanvasElement, BarcodeElement, TextElement } from './types';
import { mmToDots, DEFAULT_LABEL_HEIGHT_MM, DEFAULT_LABEL_WIDTH_MM } from '../../utils/measurements';
export type { CanvasElement } from './types';

const safeZPLText = (text: string) => text.replace(/\r?\n/g, ' ');

const barcodeCommand = (barcodeType: string, value: string, heightDots: number, showText?: boolean, moduleWidthDots = 2) => {
  const textOption = showText ? 'Y' : 'N';
  switch (barcodeType) {
    case 'EAN13':
      return `^BY${moduleWidthDots},2,${heightDots}\n^BEN,${heightDots},${textOption},N,N^FD${value}^FS`;
    case 'CODE39':
      return `^BY${moduleWidthDots},2,${heightDots}\n^B3N,${heightDots},${textOption},N,N^FD${value}^FS`;
    case 'QR':
      return `^BQN,2,5^FDLA,${value}^FS`;
    case 'CODE128':
    default:
      return `^BY${moduleWidthDots},2,${heightDots}\n^BCN,${heightDots},${textOption},N,N^FD${value}^FS`;
  }
};

const replaceVariables = (text: string, variables: Record<string,string>) => {
  return text.replace(/{{\s*([^}]+)\s*}}/g, (_m, key) => {
    const k = key.trim();
    return variables.hasOwnProperty(k) ? String(variables[k]) : '';
  });
};

export const generateZPL = (
  elements: CanvasElement[],
  widthMm: number = DEFAULT_LABEL_WIDTH_MM,
  heightMm: number = DEFAULT_LABEL_HEIGHT_MM,
  dpi: number = 203
  , variables: Record<string,string> = {}
): string => {
  const zplLines: string[] = [];
  zplLines.push('^XA');
  zplLines.push(`^PW${mmToDots(widthMm, dpi)}`);
  zplLines.push(`^LL${mmToDots(heightMm, dpi)}`);
  zplLines.push('^LH0,0');

  elements.forEach((el) => {
    const xDot = mmToDots(el.xMm, dpi);
    const yDot = mmToDots(el.yMm, dpi);

    if (el.type === 'text') {
      const textEl = el as TextElement;
      const raw = textEl.value ?? '';
      const replaced = Object.keys(variables).length ? replaceVariables(raw, variables) : raw;
      const value = safeZPLText(replaced);
      if (!value) {
        return;
      }

      const fontHeightDots = Math.max(1, mmToDots(textEl.fontSizeMm ?? 4, dpi));
      zplLines.push(`^FO${xDot},${yDot}^A0N,${fontHeightDots},${fontHeightDots}^FD${value}^FS`);
      return;
    }

    if (el.type === 'barcode') {
      const barcodeEl = el as BarcodeElement;
      const raw = barcodeEl.value ?? '';
      const replaced = Object.keys(variables).length ? replaceVariables(raw, variables) : raw;
      const value = safeZPLText(replaced);
      if (!value) {
        return;
      }

      const heightDots = Math.max(10, mmToDots(barcodeEl.heightMm ?? 10, dpi));
      const moduleWidthDots = Math.max(1, Math.round((barcodeEl.widthMm ?? 20) * dpi / 25.4 / 20));
      zplLines.push(`^FO${xDot},${yDot}${barcodeCommand(barcodeEl.barcodeType, value, heightDots, barcodeEl.showText, moduleWidthDots)}`);
      return;
    }
  });

  zplLines.push('^XZ');
  return zplLines.join('\n') + '\n';
};
