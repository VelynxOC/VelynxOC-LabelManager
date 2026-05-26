export async function renderLabelary(zpl: string, widthMm: number, heightMm: number, dpi = 203): Promise<{ ok: true; url: string } | { ok: false; reason: string }> {
  try {
    const toInches = (mm: number) => Number((mm / 25.4).toFixed(2)).toString();
    const inchesW = toInches(widthMm);
    const inchesH = toInches(heightMm);
    // Labelary expects a dpi expressed as e.g. "8dpmm" (integer); round to nearest
    const dpmmInt = Math.round(dpi / 25.4);
    const dpmm = `${dpmmInt}dpmm`;
    const url = `https://api.labelary.com/v1/printers/${dpmm}/labels/${inchesW}x${inchesH}/0/`;
    // Send as multipart/form-data with a file field, matching curl behavior
    const form = new FormData()
    const requestBlob = new Blob([zpl], { type: 'text/plain' })
    form.append('file', requestBlob, 'label.zpl')
    const res = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'image/png', 'X-Quality': 'grayscale', 'X-Linter': 'On' },
      body: form,
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => 'unknown');
      return { ok: false, reason: `labelary error: ${txt}` };
    }
    const respBlob = await res.blob();
    const blobUrl = URL.createObjectURL(respBlob);
    return { ok: true, url: blobUrl };
  } catch (err: any) {
    return { ok: false, reason: String(err?.message ?? err) };
  }
}
