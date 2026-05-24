declare module 'bwip-js' {
  interface ToCanvasOptions {
    bcid: string;
    text: string;
    scale?: number;
    includetext?: boolean;
    backgroundcolor?: string;
    paddingwidth?: number;
    paddingheight?: number;
    [key: string]: unknown;
  }

  interface BwipJS {
    toCanvas(canvas: HTMLCanvasElement, options: ToCanvasOptions): Promise<HTMLCanvasElement>;
    toBuffer(options: ToCanvasOptions): Promise<Uint8Array>;
  }

  const bwipjs: BwipJS;
  export default bwipjs;
}
