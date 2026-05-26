import { create } from 'zustand';
import type { BarcodeElement, CanvasElement, TextElement } from '../services/zpl/types';
import { DEFAULT_LABEL_WIDTH_MM, DEFAULT_LABEL_HEIGHT_MM } from '../utils/measurements';

type NewCanvasElement = Omit<TextElement, 'id'> | Omit<BarcodeElement, 'id'>;

interface CanvasState {
  elements: CanvasElement[];
  selectedElementId: string | null;
  labelWidthMm: number;
  labelHeightMm: number;
  addElement: (element: NewCanvasElement) => void;
  updateElement: (id: string, attrs: Partial<CanvasElement>) => void;
  clearElements: () => void;
  setElements: (elements: CanvasElement[]) => void;
  setLabelSize: (w: number, h: number) => void;
  setSelectedElementId: (id: string | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  elements: [],
  selectedElementId: null,
  labelWidthMm: DEFAULT_LABEL_WIDTH_MM,
  labelHeightMm: DEFAULT_LABEL_HEIGHT_MM,
  addElement: (element) => set((state) => ({
    elements: [...state.elements, { ...element, id: crypto.randomUUID() }]
  })),
  updateElement: (id, attrs) => set((state) => ({
    elements: state.elements.map(el => el.id === id ? ({ ...el, ...attrs } as CanvasElement) : el)
  })),
  clearElements: () => set({ elements: [], selectedElementId: null }),
  setElements: (elements) => set({ elements }),
  setLabelSize: (w, h) => {
    const min = 10;
    const max = 400;
    const nw = Math.max(min, Math.min(max, Number.isFinite(w) ? w : DEFAULT_LABEL_WIDTH_MM));
    const nh = Math.max(min, Math.min(max, Number.isFinite(h) ? h : DEFAULT_LABEL_HEIGHT_MM));
    set({ labelWidthMm: nw, labelHeightMm: nh });
  },
  setSelectedElementId: (id) => set({ selectedElementId: id })
}));
