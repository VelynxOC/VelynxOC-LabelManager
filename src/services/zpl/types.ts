export type BarcodeType = 'EAN13' | 'CODE128' | 'CODE39' | 'QR';

export interface CanvasElementBase {
  id: string;

  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;

  rotation?: number;
}

export interface BarcodeElement
  extends CanvasElementBase {

  type: 'barcode';

  barcodeType: BarcodeType;

  value: string;

  showText?: boolean;
}

export interface TextElement
  extends CanvasElementBase {

  type: 'text';

  value: string;

  fontSizeMm: number;
}

export type CanvasElement =
  | BarcodeElement
  | TextElement;
