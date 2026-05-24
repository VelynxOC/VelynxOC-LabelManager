import { Image, Rect, Text } from 'react-konva';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { BarcodeElement, CanvasElement, TextElement } from '../services/zpl/types';
import { mmToPx } from '../utils/measurements';

export function CanvasElementRenderer({ element }: { element: CanvasElement }) {
  if (element.type === 'barcode') {
    return <BarcodeRenderer element={element} />;
  }

  if (element.type === 'text') {
    const textEl = element as TextElement;
    return (
      <Text
        x={0}
        y={0}
        text={textEl.value}
        fontSize={Math.max(1, mmToPx(textEl.fontSizeMm))}
        width={Math.max(1, mmToPx(textEl.widthMm))}
        fill="black"
      />
    );
  }

  return null;
}

function BarcodeRenderer({ element }: { element: BarcodeElement }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

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

    const widthPx = Math.max(1, Math.round(mmToPx(element.widthMm)));
    const heightPx = Math.max(1, Math.round(mmToPx(element.heightMm)));

    const useWorker = typeof (window as any).OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined';

    setLoading(true);

    if (useWorker) {
      const ensureWorker = () => {
        if (workerRef.current) return;

        const cdnUrls = [
          'https://cdn.jsdelivr.net/npm/bwip-js/dist/bwip-js-min.js',
          'https://unpkg.com/bwip-js/dist/bwip-js-min.js',
        ];

        const createCdnWorker = (urls: string[]): Worker | null => {
          try {
            const script = `
              self.importScripts('${urls[0]}');
              self.onmessage = function(e) {
                const d = e.data;
                const id = d.id;
                try {
                  const canvas = new OffscreenCanvas(d.widthPx, d.heightPx);
                  bwipjs.toCanvas(canvas, { bcid: d.barcodeType, text: d.value, scale: 1, includetext: d.showText ? true : false, backgroundcolor: 'FFFFFF', paddingwidth:5, paddingheight:5 });
                  canvas.convertToBlob().then(function(blob) {
                    const reader = new FileReader();
                    reader.onload = function() { self.postMessage({ id: id, dataUrl: reader.result }); };
                    reader.readAsDataURL(blob);
                  }).catch(function(err){ self.postMessage({ id: id, error: err && err.message || String(err) }); });
                } catch (err) { self.postMessage({ id: id, error: err && err.message || String(err) }); }
              };
            `;
            const blob = new Blob([script], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            return new Worker(url);
          } catch (e) {
            return null;
          }
        };

        const w = createCdnWorker(cdnUrls);
        if (w) {
          workerRef.current = w;
          return;
        }

        // Fallback to bundled worker
        try {
          // @ts-ignore - Vite supports new URL for workers
          workerRef.current = new Worker(new URL('../workers/bwip.worker.ts', import.meta.url));
        } catch (e) {
          workerRef.current = null;
        }
      };

      ensureWorker();

      const w = workerRef.current!;
      const id = crypto.randomUUID();

      const handle = (ev: MessageEvent<any>) => {
        const data = ev.data as { id: string; dataUrl?: string; error?: string };
        if (data.id !== id) return;
        if (data.error) {
          setImage(null);
          setLoading(false);
          return;
        }
        const img = new window.Image();
        img.onload = () => {
          if (!cancelled) {
            setImage(img);
            setLoading(false);
          }
        };
        img.src = data.dataUrl!;
      };

      w.addEventListener('message', handle as any);

      w.postMessage({ id, barcodeType, value: element.value, widthPx, heightPx, showText: element.showText });

      return () => {
        cancelled = true;
        w.removeEventListener('message', handle as any);
      };
    }

    // Fallback: try loading bwip-js from CDN at runtime (avoid bundling), then fallback to dynamic import
    (async () => {
      const cdnUrls = [
        'https://cdn.jsdelivr.net/npm/bwip-js/dist/bwip-js-min.js',
        'https://unpkg.com/bwip-js/dist/bwip-js-min.js',
      ];

      const loadFromCdn = async (): Promise<any | null> => {
        for (const url of cdnUrls) {
          try {
            await new Promise<void>((resolve, reject) => {
              const existing = document.querySelector(`script[src="${url}"]`);
              if (existing) {
                // wait a tick for it to be available
                return setTimeout(() => resolve(), 50);
              }
              const s = document.createElement('script');
              s.src = url;
              s.async = true;
              s.onload = () => resolve();
              s.onerror = () => reject(new Error('cdn load error'));
              document.head.appendChild(s);
            });
            // bwipjs global name may be `bwipjs` or `bwip` depending on bundle
            // @ts-ignore
            const g = (window as any).bwipjs || (window as any).bwip || (window as any).BWIPJS;
            if (g) return g;
          } catch {}
        }
        return null;
      };

      try {
        const bwipjs: any = await loadFromCdn();
        if (!bwipjs) {
          // CDN not available — cannot render barcode in main thread without bundling.
          setLoading(false);
          setImage(null);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(100, widthPx * 2);
        canvas.height = Math.max(40, heightPx * 2);

        await bwipjs.toCanvas(canvas, {
          bcid: barcodeType,
          text: element.value,
          scale: 2,
          includetext: element.showText ? true : false,
          backgroundcolor: 'FFFFFF',
          paddingwidth: 5,
          paddingheight: 5,
        });

        if (cancelled) return;

        const img = new window.Image();
        img.onload = () => {
          if (!cancelled) {
            setImage(img);
            setLoading(false);
          }
        };
        img.src = canvas.toDataURL('image/png');
      } catch {
        if (!cancelled) setImage(null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [barcodeType, element.value, element.widthMm, element.heightMm, element.showText]);

  if (!image) {
    return (
      <Rect
        x={0}
        y={0}
        width={Math.max(1, mmToPx(element.widthMm))}
        height={Math.max(1, mmToPx(element.heightMm))}
        fill={loading ? '#f1f5f9' : '#e2e8f0'}
        stroke="#64748b"
        strokeWidth={1}
      />
    );
  }

  return (
    <Image
      x={0}
      y={0}
      image={image}
      width={Math.max(1, mmToPx(element.widthMm))}
      height={Math.max(1, mmToPx(element.heightMm))}
    />
  );
}

