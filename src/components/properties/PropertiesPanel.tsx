import { useCanvasStore } from '../../store/useCanvasStore';
import { Settings } from 'lucide-react';
import type { BarcodeElement, TextElement } from '../../services/zpl/types';

// Type guard for TextElement
function isTextElement(el: any): el is TextElement {
  return el && el.type === 'text' && 'value' in el && 'fontSizeMm' in el;
}

// Type guard for BarcodeElement
function isBarcodeElement(el: any): el is BarcodeElement {
  return el && el.type === 'barcode' && 'barcodeType' in el && 'value' in el;
}

export const PropertiesPanel = () => {
  const elements = useCanvasStore((state) => state.elements);
  const selectedElementId = useCanvasStore((state) => state.selectedElementId);
  const updateElement = useCanvasStore((state) => state.updateElement);

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  if (!selectedElement) {
    return (
      <div className="w-72 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col items-center justify-center text-center text-slate-500 h-[600px]">
        <Settings size={48} className="mb-4 opacity-20" />
        <p>Selecciona un elemento en el lienzo para editar sus propiedades.</p>
      </div>
    );
  }

  return (
    <div className="w-72 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl h-[600px] flex flex-col gap-6">
      <div className="flex items-center gap-2 text-white border-b border-slate-700 pb-4">
        <Settings size={20} />
        <h2 className="text-xl font-bold">Propiedades</h2>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-slate-400 font-medium">Tipo</label>
          <div className="text-white bg-slate-900 p-2 rounded-lg capitalize border border-slate-700">
            {selectedElement.type}
          </div>
        </div>

        {isTextElement(selectedElement) && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-400 font-medium">Texto</label>
              <input
                type="text"
                value={selectedElement.value}
                onChange={(e) => updateElement(selectedElement.id, { value: e.target.value })}
                className="bg-slate-900 border border-slate-700 text-white p-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-400 font-medium">Tamaño de Fuente (mm)</label>
              <input
                type="number"
                value={selectedElement.fontSizeMm}
                min={1}
                onChange={(e) => updateElement(selectedElement.id, { fontSizeMm: Number(e.target.value) })}
                className="bg-slate-900 border border-slate-700 text-white p-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </>
        )}

        {isBarcodeElement(selectedElement) && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-400 font-medium">Valor</label>
              <input
                type="text"
                value={selectedElement.value}
                onChange={(e) => updateElement(selectedElement.id, { value: e.target.value })}
                className="bg-slate-900 border border-slate-700 text-white p-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-400 font-medium">Tipo de Código</label>
              <select
                value={selectedElement.barcodeType}
                onChange={(e) => updateElement(selectedElement.id, { barcodeType: e.target.value as any })}
                className="bg-slate-900 border border-slate-700 text-white p-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="EAN13">EAN13</option>
                <option value="CODE128">CODE128</option>
                <option value="CODE39">CODE39</option>
                <option value="QR">QR</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-400 font-medium">Mostrar texto</label>
              <input
                type="checkbox"
                checked={!!selectedElement.showText}
                onChange={(e) => updateElement(selectedElement.id, { showText: e.target.checked })}
                className="accent-blue-500"
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-400 font-medium">Pos X (mm)</label>
            <input
              type="number"
              value={selectedElement.xMm}
              onChange={(e) => updateElement(selectedElement.id, { xMm: Number(e.target.value) })}
              className="bg-slate-900 border border-slate-700 text-white p-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-400 font-medium">Pos Y (mm)</label>
            <input
              type="number"
              value={selectedElement.yMm}
              onChange={(e) => updateElement(selectedElement.id, { yMm: Number(e.target.value) })}
              className="bg-slate-900 border border-slate-700 text-white p-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-400 font-medium">Ancho (mm)</label>
            <input
              type="number"
              value={selectedElement.widthMm}
              min={1}
              onChange={(e) => updateElement(selectedElement.id, { widthMm: Number(e.target.value) })}
              className="bg-slate-900 border border-slate-700 text-white p-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-400 font-medium">Alto (mm)</label>
            <input
              type="number"
              value={selectedElement.heightMm}
              min={1}
              onChange={(e) => updateElement(selectedElement.id, { heightMm: Number(e.target.value) })}
              className="bg-slate-900 border border-slate-700 text-white p-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
