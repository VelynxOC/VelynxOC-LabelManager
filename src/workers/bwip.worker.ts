type MsgIn = {
  id: string;
  barcodeType: string;
  value: string;
  widthPx: number;
  heightPx: number;
  showText?: boolean;
};

type MsgOut = {
  id: string;
  dataUrl?: string;
  error?: string;
};

self.addEventListener('message', async (ev: MessageEvent<MsgIn>) => {
  const msg = ev.data;
  const out: MsgOut = { id: msg.id };
  try {
    // Try to load bwip-js from CDN at runtime
    try {
      // @ts-ignore
      importScripts('https://cdn.jsdelivr.net/npm/bwip-js/dist/bwip-js-min.js');
    } catch {}

    // bwipjs should be available globally when using the UMD bundle
    const bwipGlobal = (self as any).bwipjs || (self as any).bwip || (self as any).BWIPJS;

    if (!bwipGlobal) {
      out.error = 'bwip-js not available in worker';
      (self as any).postMessage(out);
      return;
    }

    const canvas = new OffscreenCanvas(Math.max(1, msg.widthPx), Math.max(1, msg.heightPx));
    await (bwipGlobal as any).toCanvas(canvas as any, {
      bcid: msg.barcodeType,
      text: msg.value,
      scale: 2,
      includetext: !!msg.showText,
      backgroundcolor: 'FFFFFF',
      paddingwidth: 5,
      paddingheight: 5,
    });

    // convert to blob/dataURL
    const blob = await canvas.convertToBlob();
    const reader = new FileReader();
    reader.onload = () => {
      out.dataUrl = reader.result as string;
      (self as any).postMessage(out);
    };
    reader.onerror = () => {
      out.error = 'failed to read blob';
      (self as any).postMessage(out);
    };
    reader.readAsDataURL(blob);
  } catch (err: any) {
    out.error = String(err?.message ?? err);
    (self as any).postMessage(out);
  }
});
