import { create } from 'zustand';
import type { BarcodeElement, CanvasElement, TextElement } from '../services/zpl/types';

type NewCanvasElement = Omit<TextElement, 'id'> | Omit<BarcodeElement, 'id'>;

interface CanvasState {
  elements: CanvasElement[];
  selectedElementId: string | null;
  addElement: (element: NewCanvasElement) => void;
  updateElement: (id: string, attrs: Partial<CanvasElement>) => void;
  clearElements: () => void;
  setElements: (elements: CanvasElement[]) => void;
  setSelectedElementId: (id: string | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  elements: [],
  selectedElementId: null,
  addElement: (element) => set((state) => ({
    elements: [...state.elements, { ...element, id: crypto.randomUUID() }]
  })),
  updateElement: (id, attrs) => set((state) => ({
    elements: state.elements.map(el => el.id === id ? ({ ...el, ...attrs } as CanvasElement) : el)
  })),
  clearElements: () => set({ elements: [], selectedElementId: null }),
  setElements: (elements) => set({ elements }),
  setSelectedElementId: (id) => set({ selectedElementId: id })
}));
