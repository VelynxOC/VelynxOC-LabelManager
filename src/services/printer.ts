export type PrintResult = { ok: true } | { ok: false; reason: string };

/**
 * Attempt to send raw ZPL to a printer.
 * Strategies (in order):
 * 1. Electron/Node environment using `net` module (if available via `window.require`).
 * 2. Proxy API `/api/print` on same origin (expects JSON { ip, port, zpl }).
 * If none available, returns an error suggesting download.
 */
export async function sendToPrinter(ip: string, zpl: string, port = 9100): Promise<PrintResult> {
  // 1) Electron/Node net socket (if available)
  try {
    // @ts-ignore
    const req = (window as any).require;
    if (typeof req === 'function') {
      try {
        // @ts-ignore
        const net = req('net');
        return await new Promise<PrintResult>((resolve) => {
          try {
            const client = new net.Socket();
            client.connect(port, ip, () => {
              client.write(zpl, () => {
                client.end();
                resolve({ ok: true });
              });
            });
            client.on('error', (err: any) => {
              resolve({ ok: false, reason: String(err?.message ?? err) });
            });
          } catch (err: any) {
            resolve({ ok: false, reason: String(err?.message ?? err) });
          }
        });
      } catch {}
    }
  } catch {}

  // 2) Proxy API
  try {
    const res = await fetch('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, port, zpl }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => 'unknown');
      return { ok: false, reason: `proxy failed: ${text}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: String(err?.message ?? err) };
  }
}
