import type { CanvasElement, BarcodeElement, TextElement } from './types';
import { mmToDots, DEFAULT_LABEL_HEIGHT_MM, DEFAULT_LABEL_WIDTH_MM } from '../../utils/measurements';
export type { CanvasElement } from './types';

const safeZPLText = (text: string) => text.replace(/\r?\n/g, ' ');

const barcodeCommand = (barcodeType: string, value: string, heightDots: number, showText?: boolean, moduleWidthDots = 2, textHeightDots?: number) => {
  const textOption = showText ? 'Y' : 'N';
  switch (barcodeType) {
    case 'EAN13':
      return `${showText && textHeightDots ? `^A0N,${textHeightDots},${textHeightDots}` : ''}^BY${moduleWidthDots},2,${heightDots}\n^BEN,${heightDots},${textOption},N,N^FD${value}^FS`;
    case 'CODE39':
      return `${showText && textHeightDots ? `^A0N,${textHeightDots},${textHeightDots}` : ''}^BY${moduleWidthDots},2,${heightDots}\n^B3N,${heightDots},${textOption},N,N^FD${value}^FS`;
    case 'QR':
      return `^BQN,2,5^FDLA,${value}^FS`;
    case 'CODE128':
    default:
      return `${showText && textHeightDots ? `^A0N,${textHeightDots},${textHeightDots}` : ''}^BY${moduleWidthDots},2,${heightDots}\n^BCN,${heightDots},${textOption},N,N^FD${value}^FS`;
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
  zplLines.push(`^FX LabelSize: ${widthMm}mm x ${heightMm}mm`);
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
      const totalDots = Math.max(1, mmToDots(barcodeEl.widthMm ?? 20, dpi));

      const estimateModules = (type: string, val: string) => {
        const len = Math.max(1, val.length);
        switch (type) {
          case 'EAN13':
            return 95; // fixed modules for EAN-13 (including guards)
          case 'CODE39':
            // 13 modules per encoded character (including inter-character gap)
            // ZPL will add start/stop; account for them as two characters
            return 13 * (len + 2);
          case 'CODE128':
            // Approximate: ~11 modules per data char + start/stop/checksum overhead
            return 11 * len + 35;
          case 'QR':
            return Math.max(21, 21);
          default:
            return 11 * len + 35;
        }
      };

      const modules = estimateModules(barcodeEl.barcodeType, value);
      // Include quiet zone recommendation: at least 10 narrow-module units each side
      const quietModules = 10;
      const effectiveModules = modules + quietModules * 2;
      let moduleWidthDots = Math.floor(totalDots / effectiveModules);
      if (moduleWidthDots < 1) moduleWidthDots = 1;
      const textHeightDots = barcodeEl.textFontSizeMm ? Math.max(1, mmToDots(barcodeEl.textFontSizeMm, dpi)) : undefined;
      zplLines.push(`^FO${xDot},${yDot}${barcodeCommand(barcodeEl.barcodeType, value, heightDots, barcodeEl.showText, moduleWidthDots, textHeightDots)}`);
      return;
    }
  });

  zplLines.push('^XZ');
  return zplLines.join('\n') + '\n';
};
