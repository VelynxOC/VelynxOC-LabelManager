import type { CanvasElement } from './zpl/types';

const STORAGE_KEY = 'label_templates_v1';

export interface SavedTemplate {
  name: string;
  elements: CanvasElement[];
  variables?: Record<string,string>;
  createdAt: string;
}

export function listTemplates(): SavedTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedTemplate[];
  } catch {
    return [];
  }
}

export function saveTemplate(name: string, elements: CanvasElement[], variables?: Record<string,string>) {
  const all = listTemplates();
  const existingIndex = all.findIndex(t => t.name === name);
  const entry: SavedTemplate = { name, elements, variables, createdAt: new Date().toISOString() };
  if (existingIndex >= 0) {
    all[existingIndex] = entry;
  } else {
    all.push(entry);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteTemplate(name: string) {
  const all = listTemplates();
  const filtered = all.filter(t => t.name !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function loadTemplate(name: string): SavedTemplate | null {
  const all = listTemplates();
  const found = all.find(t => t.name === name);
  return found ?? null;
}
