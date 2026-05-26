import { useCanvasStore } from '../../store/useCanvasStore';
import { Settings } from 'lucide-react';
import type { BarcodeElement, TextElement } from '../../services/zpl/types';

import { notify } from '../../services/toast';

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
  
  const labelWidthMm = useCanvasStore((state) => state.labelWidthMm);
  const labelHeightMm = useCanvasStore((state) => state.labelHeightMm);
  const setLabelSize = useCanvasStore((state) => state.setLabelSize);

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  return (
    <div className="w-80 bg-slate-800 p-5 border-l border-slate-700 h-full overflow-y-auto shrink-0 z-10 shadow-lg flex flex-col gap-6">
      
      {/* Dimensiones del Lienzo (Siempre visibles) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-white">
          <Settings size={18} />
          <h2 className="text-lg font-bold">Lienzo</h2>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex-1 flex flex-col">
            <label className="text-[10px] text-slate-400 mb-1">Ancho (mm)</label>
            <input type="number" min={10} max={400} value={labelWidthMm} onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) setLabelSize(v, labelHeightMm);
            }} onBlur={(e) => {
              const v = Number(e.target.value);
              if (v < 10 || v > 400) notify('Ancho fuera de rango (10-400mm)', 'warn');
            }} className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 outline-none p-2 rounded text-xs text-white transition-colors" />
          </div>
          <span className="text-slate-500 mt-4">×</span>
          <div className="flex-1 flex flex-col">
            <label className="text-[10px] text-slate-400 mb-1">Alto (mm)</label>
            <input type="number" min={10} max={400} value={labelHeightMm} onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) setLabelSize(labelWidthMm, v);
            }} onBlur={(e) => {
              const v = Number(e.target.value);
              if (v < 10 || v > 400) notify('Alto fuera de rango (10-400mm)', 'warn');
            }} className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 outline-none p-2 rounded text-xs text-white transition-colors" />
          </div>
        </div>
      </div>

      <hr className="border-slate-700" />

      {/* Propiedades del Elemento Seleccionado */}
      {!selectedElement ? (
        <div className="flex flex-col items-center justify-center text-center text-slate-500 mt-10">
          <Settings size={48} className="mb-4 opacity-10" />
          <p className="text-xs">Selecciona un elemento en el lienzo para editar sus propiedades específicas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white">
            <h2 className="text-lg font-bold">Propiedades</h2>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tipo</label>
            <div className="text-slate-300 bg-slate-900/50 p-2 rounded text-xs capitalize border border-slate-700/50">
              {selectedElement.type}
            </div>
          </div>

          {isTextElement(selectedElement) && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Texto</label>
                <input
                  type="text"
                  value={selectedElement.value}
                  onChange={(e) => updateElement(selectedElement.id, { value: e.target.value })}
                  className="bg-slate-900 border border-slate-700 text-white p-2 rounded text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tamaño de Fuente (mm)</label>
                <input
                  type="number"
                  value={selectedElement.fontSizeMm}
                  min={1}
                  onChange={(e) => updateElement(selectedElement.id, { fontSizeMm: Number(e.target.value) })}
                  className="bg-slate-900 border border-slate-700 text-white p-2 rounded text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </>
          )}

          {isBarcodeElement(selectedElement) && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Valor</label>
                <input
                  type="text"
                  value={selectedElement.value}
                  onChange={(e) => updateElement(selectedElement.id, { value: e.target.value })}
                  className="bg-slate-900 border border-slate-700 text-white p-2 rounded text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tipo de Código</label>
                <select
                  value={selectedElement.barcodeType}
                  onChange={(e) => updateElement(selectedElement.id, { barcodeType: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 text-white p-2 rounded text-xs focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="EAN13">EAN13</option>
                  <option value="CODE128">CODE128</option>
                  <option value="CODE39">CODE39</option>
                  <option value="QR">QR</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  checked={!!selectedElement.showText}
                  onChange={(e) => updateElement(selectedElement.id, { showText: e.target.checked })}
                  className="accent-blue-500"
                  id={`showText-${selectedElement.id}`}
                />
                <label htmlFor={`showText-${selectedElement.id}`} className="text-xs text-slate-400 cursor-pointer">Mostrar texto debajo</label>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Pos X (mm)</label>
              <input
                type="number"
                value={selectedElement.xMm}
                onChange={(e) => updateElement(selectedElement.id, { xMm: Number(e.target.value) })}
                className="bg-slate-900 border border-slate-700 text-white p-2 rounded text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Pos Y (mm)</label>
              <input
                type="number"
                value={selectedElement.yMm}
                onChange={(e) => updateElement(selectedElement.id, { yMm: Number(e.target.value) })}
                className="bg-slate-900 border border-slate-700 text-white p-2 rounded text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ancho (mm)</label>
              <input
                type="number"
                value={selectedElement.widthMm}
                min={1}
                onChange={(e) => updateElement(selectedElement.id, { widthMm: Number(e.target.value) })}
                className="bg-slate-900 border border-slate-700 text-white p-2 rounded text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Alto (mm)</label>
              <input
                type="number"
                value={selectedElement.heightMm}
                min={1}
                onChange={(e) => updateElement(selectedElement.id, { heightMm: Number(e.target.value) })}
                className="bg-slate-900 border border-slate-700 text-white p-2 rounded text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
