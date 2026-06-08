import {
  Image,
  Rect,
  Text,
} from 'react-konva';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  BarcodeElement,
  CanvasElement,
  TextElement,
} from '../services/zpl/types';

import { mmToPx } from '../utils/measurements';
import { useCanvasStore } from '../store/useCanvasStore';

/** Reemplaza {{clave}} con el valor correspondiente del diccionario de variables */
const resolveVariables = (text: string, variables: Record<string, string>): string =>
  text.replace(/{\{\s*([^}]+)\s*}}/g, (_m, key) => {
    const k = key.trim();
    return Object.prototype.hasOwnProperty.call(variables, k) ? variables[k] : `{{${k}}}`;
  });

type BwipJs = {
  toCanvas: (
    canvas: HTMLCanvasElement,
    options: Record<string, unknown>
  ) => Promise<void>;
};

declare global {
  interface Window {
    bwipjs?: BwipJs;
    bwip?: BwipJs;
  }
}

export function CanvasElementRenderer({
  element,
}: {
  element: CanvasElement;
}) {
  if (element.type === 'barcode') {
    return (
      <BarcodeRenderer
        element={element}
      />
    );
  }

  if (element.type === 'text') {
    const textEl = element as TextElement;
    return <TextRenderer element={textEl} />;
  }

  return null;
}

function TextRenderer({ element }: { element: TextElement }) {
  const variables = useCanvasStore((s) => s.variables);
  const resolved = resolveVariables(element.value, variables);
  const isResolved = resolved !== element.value;

  return (
    <Text
      x={0}
      y={0}
      text={resolved || element.value}
      fontSize={mmToPx(element.fontSizeMm)}
      fill={isResolved ? '#1D4ED8' : 'black'}
    />
  );
}

function BarcodeRenderer({
  element,
}: {
  element: BarcodeElement;
}) {
  const variables = useCanvasStore((s) => s.variables);
  const [image, setImage] =
    useState<HTMLImageElement | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const barcodeType = useMemo(() => {
    switch (element.barcodeType) {
      case 'EAN13':
        return 'ean13';

      case 'CODE39':
        return 'code39';

      case 'QR':
        return 'qrcode';

      case 'CODE128':
      default:
        return 'code128';
    }
  }, [element.barcodeType]);

  useEffect(() => {
    let cancelled = false;

    const renderBarcode =
      async (): Promise<void> => {
        try {
          setLoading(true);

          const widthPx =
            Math.max(
              1,
              Math.round(
                mmToPx(
                  element.widthMm
                )
              )
            );

          const heightPx =
            Math.max(
              1,
              Math.round(
                mmToPx(
                  element.heightMm
                )
              )
            );

          const cdnUrls = [
            'https://cdn.jsdelivr.net/npm/bwip-js/dist/bwip-js-min.js',
            'https://unpkg.com/bwip-js/dist/bwip-js-min.js',
          ];

          let bwipjs: BwipJs | null =
            null;

          for (const url of cdnUrls) {
            try {
              await new Promise<void>(
                (
                  resolve,
                  reject
                ) => {
                  const existing =
                    document.querySelector(
                      `script[src="${url}"]`
                    );

                  if (existing) {
                    resolve();
                    return;
                  }

                  const s =
                    document.createElement(
                      'script'
                    );

                  s.src = url;

                  s.async = true;

                  s.onload = () =>
                    resolve();

                  s.onerror = () =>
                    reject(
                      new Error(
                        'Error cargando bwip-js'
                      )
                    );

                  document.head.appendChild(
                    s
                  );
                }
              );

              bwipjs =
                window.bwipjs ??
                window.bwip ??
                null;

              if (bwipjs) {
                break;
              }
            } catch {
              // continuar siguiente CDN
            }
          }

          if (!bwipjs) {
            throw new Error(
              'bwip-js no disponible'
            );
          }

          const canvas =
            document.createElement(
              'canvas'
            );

          canvas.width = widthPx;

          canvas.height = heightPx;

          const resolvedValue = resolveVariables(element.value, variables);
          const options: Record<string, unknown> = {
  bcid: barcodeType,

  text: resolvedValue || element.value,

  includetext: !!element.showText,

  backgroundcolor: 'FFFFFF',

  paddingwidth: 0,

  paddingheight: 0,

  /**
   * Escala interna bwip-js
   */
  scale: 4,

  /**
   * Altura barras
   */
  height: Math.max(
    10,
    element.heightMm * 0.7
  ),
};

          if (
            element.textFontSizeMm
          ) {
            options.textsize =
              Math.max(
                6,
                Math.round(
                  mmToPx(
                    element.textFontSizeMm
                  )
                )
              );
          }

          await bwipjs.toCanvas(
            canvas,
            options
          );

          if (cancelled) {
            return;
          }

          const img =
            new window.Image();

          img.onload = () => {
            if (!cancelled) {
              setImage(img);

              setLoading(false);
            }
          };

          img.src =
            canvas.toDataURL(
              'image/png'
            );
        } catch (err: unknown) {
          if (!cancelled) {
            if (
              err instanceof Error
            ) {
              setError(
                err.message
              );
            } else {
              setError(
                String(err)
              );
            }

            setLoading(false);

            setImage(null);
          }
        }
      };

    renderBarcode();

    return () => {
      cancelled = true;
    };
  }, [
    barcodeType,
    element.value,
    element.widthMm,
    element.heightMm,
    element.showText,
    element.textFontSizeMm,
    variables,
  ]);

  const widthPx = Math.max(
    1,
    mmToPx(element.widthMm)
  );

  const heightPx = Math.max(
    1,
    mmToPx(element.heightMm)
  );

  if (!image) {
    return (
      <>
        <Rect
          x={0}
          y={0}
          width={widthPx}
          height={heightPx}
          fill={
            loading
              ? '#F1F5F9'
              : '#FFFFFF'
          }
          stroke="#94A3B8"
          strokeWidth={1}
        />

        <Text
          x={6}
          y={10}
          text={
            loading
              ? 'Generando...'
              : error ||
                element.value
          }
          fontSize={14}
          fill={
            error
              ? '#DC2626'
              : '#334155'
          }
        />
      </>
    );
  }

  return (
    <Image
  x={0}
  y={0}
  image={image}
  width={widthPx}
  height={heightPx}
/>
  );
}