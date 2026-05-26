export interface PrinterEntry {
  id: string;
  name: string;
  ip: string;
  brand?: string;
  model?: string;
  port?: number;
  createdAt: string;
}

const KEY = 'printers_v1';

export function listPrinters(): PrinterEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PrinterEntry[];
  } catch {
    return [];
  }
}

export function savePrinter(p: Omit<PrinterEntry, 'id' | 'createdAt'> & { id?: string }) {
  const all = listPrinters();
  const id = p.id ?? crypto.randomUUID();
  const entry: PrinterEntry = { ...p, id, createdAt: new Date().toISOString() } as PrinterEntry;
  const idx = all.findIndex(x => x.id === id);
  if (idx >= 0) all[idx] = entry;
  else all.push(entry);
  localStorage.setItem(KEY, JSON.stringify(all));
  return entry;
}

export function deletePrinter(id: string) {
  const all = listPrinters();
  const filtered = all.filter(p => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(filtered));
}

export function updatePrinter(id: string, patch: Partial<PrinterEntry>) {
  const all = listPrinters();
  const idx = all.findIndex(p => p.id === id);
  if (idx < 0) return null;
  const updated = { ...all[idx], ...patch };
  all[idx] = updated;
  localStorage.setItem(KEY, JSON.stringify(all));
  return updated;
}

export function loadPrinter(id: string) {
  return listPrinters().find(p => p.id === id) ?? null;
}

export function setDefaultPrinter(id: string | null) {
  if (!id) {
    localStorage.removeItem('default_printer');
  } else {
    localStorage.setItem('default_printer', id);
  }
}

export function getDefaultPrinterId(): string | null {
  return localStorage.getItem('default_printer');
}

export function getDefaultPrinter() {
  const id = getDefaultPrinterId();
  if (!id) return null;
  return loadPrinter(id);
}
