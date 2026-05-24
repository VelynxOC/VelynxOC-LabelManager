import { Type, Play, Trash2, Barcode, Save } from 'lucide-react';
import { useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { generateZPL } from '../../services/zpl';
import { DEFAULT_LABEL_HEIGHT_MM, DEFAULT_LABEL_WIDTH_MM } from '../../utils/measurements';
import { listTemplates, saveTemplate, deleteTemplate, loadTemplate } from '../../services/storage';
import { sendToPrinter } from '../../services/printer';
import ZplPreview from '../modals/ZplPreview';
import VariablesPanel from '../VariablesPanel';
import PrintJobsPanel from '../PrintJobsPanel';
import { enqueueJob } from '../../services/printQueue';
import { loadVariables } from '../../services/variables';

export const Toolbar = () => {
  const { addElement, clearElements, elements, setElements } = useCanvasStore();
  const [templates, setTemplates] = useState(() => listTemplates());
  const [previewZpl, setPreviewZpl] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string,string>>(() => loadVariables());

  const handleAddText = () => {
    addElement({
      type: 'text',
      value: 'Texto de Prueba',
      xMm: 10,
      yMm: 10,
      widthMm: 40,
      heightMm: 12,
      fontSizeMm: 4,
    });
  };

  const handleAddBarcode = () => {
    addElement({
      type: 'barcode',
      barcodeType: 'CODE128',
      value: '123456789012',
      xMm: 10,
      yMm: 25,
      widthMm: 60,
      heightMm: 20,
      showText: true,
    });
  };

  const handleGenerateZPL = () => {
    const zpl = generateZPL(elements, DEFAULT_LABEL_WIDTH_MM, DEFAULT_LABEL_HEIGHT_MM, 203, variables);
    console.log('--- ZPL GENERADO ---');
    console.log(zpl);
    setPreviewZpl(zpl);
  };

  const handleSaveTemplate = () => {
    const name = window.prompt('Nombre para la plantilla:');
    if (!name) return;
    saveTemplate(name, elements, variables);
    setTemplates(listTemplates());
    alert('Plantilla guardada.');
  };

  const handleLoadTemplate = (name: string) => {
    const tpl = loadTemplate(name);
    if (!tpl) {
      alert('Plantilla no encontrada');
      return;
    }
    setElements(tpl.elements);
    if (tpl.variables) setVariables(tpl.variables);
    setTemplates(listTemplates());
  };

  const [printerIp, setPrinterIp] = useState('');

  const handlePrint = async () => {
    if (!printerIp) return alert('Ingresa la IP de la impresora');
    const zpl = generateZPL(elements, DEFAULT_LABEL_WIDTH_MM, DEFAULT_LABEL_HEIGHT_MM, 203, variables);
    const res = await sendToPrinter(printerIp, zpl, 9100);
    if (res.ok) {
      alert('Enviado a la impresora');
    } else {
      if (confirm(`Fallo al imprimir: ${res.reason}. ¿Descargar ZPL para envío manual?`)) {
        handleDownloadZpl(zpl);
      }
    }
  };

  const [showJobs, setShowJobs] = useState(false);

  const handleEnqueue = () => {
    if (!printerIp) return alert('Ingresa la IP de la impresora');
    const zpl = generateZPL(elements, DEFAULT_LABEL_WIDTH_MM, DEFAULT_LABEL_HEIGHT_MM, 203, variables);
    enqueueJob(printerIp, zpl, 'Manual print');
    alert('Trabajo agregado a la cola');
    setShowJobs(true);
  };

  const handleDeleteTemplate = (name: string) => {
    if (!confirm(`Eliminar plantilla "${name}"?`)) return;
    deleteTemplate(name);
    setTemplates(listTemplates());
  };

  const handleCopyZpl = async (zpl: string) => {
    try {
      await navigator.clipboard.writeText(zpl);
      alert('ZPL copiado al portapapeles');
    } catch {
      alert('No se pudo copiar');
    }
  };

  const handleDownloadZpl = (zpl: string) => {
    const blob = new Blob([zpl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'label.zpl';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 w-64 bg-slate-800 p-6 rounded-xl border border-slate-700 h-[600px] shadow-xl">
      <h2 className="text-xl font-bold text-white mb-4">Herramientas</h2>

      <button
        onClick={handleAddText}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors font-medium"
      >
        <Type size={20} />
        Agregar Texto
      </button>

      <button
        onClick={handleAddBarcode}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition-colors font-medium"
      >
        <Barcode size={20} />
        Agregar Código
      </button>

      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={handleGenerateZPL}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-lg transition-colors font-medium justify-center"
        >
          <Play size={20} />
          Generar ZPL
        </button>

        <button
          onClick={handleSaveTemplate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors font-medium justify-center"
        >
          <Save size={20} />
          Guardar Plantilla
        </button>

        <div className="flex gap-2 items-center">
          <select
            value={''}
            onChange={(e) => handleLoadTemplate(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white p-2 rounded-lg flex-1"
          >
            <option value="">Cargar plantilla...</option>
            {templates.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
              const name = templates.length ? templates[templates.length - 1]?.name : null;
              if (name) handleDeleteTemplate(name);
            }}
            title="Eliminar última plantilla"
            className="ml-2 p-2 bg-red-600/20 rounded text-red-400"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <button
          onClick={clearElements}
          className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 p-3 rounded-lg transition-colors font-medium justify-center"
        >
          <Trash2 size={20} />
          Limpiar
        </button>
      </div>
      <div className="mt-3">
        <label className="text-sm text-slate-300">IP impresora</label>
        <div className="flex gap-2 mt-2">
          <input value={printerIp} onChange={(e) => setPrinterIp(e.target.value)} placeholder="192.168.0.100" className="flex-1 bg-slate-900 p-2 rounded text-white" />
          <button onClick={handlePrint} className="bg-emerald-600 px-3 rounded text-white">Imprimir</button>
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={handleEnqueue} className="flex-1 bg-yellow-600 px-3 py-2 rounded text-white">Enviar a cola</button>
        <button onClick={() => setShowJobs(true)} className="bg-slate-700 px-3 py-2 rounded text-white">Ver Cola</button>
      </div>
      <VariablesPanel onChange={(v) => setVariables(v)} />
      {showJobs && <PrintJobsPanel onClose={() => setShowJobs(false)} />}
      {previewZpl && (
        <ZplPreview
          zpl={previewZpl}
          onClose={() => setPreviewZpl(null)}
          onCopy={() => handleCopyZpl(previewZpl)}
          onDownload={() => handleDownloadZpl(previewZpl)}
        />
      )}
    </div>
  );
};
