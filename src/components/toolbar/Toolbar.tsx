import { Type, Play, Trash2, Barcode, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { generateZPL } from '../../services/zpl';
// label size is stored in the canvas store; measurements helpers used elsewhere
import { listTemplates, saveTemplate, deleteTemplate, loadTemplate } from '../../services/storage';
import { sendToPrinter } from '../../services/printer';
import { countPending } from '../../services/printQueue';
import { listPrinters, getDefaultPrinter } from '../../services/printers';
import { notify } from '../../services/toast';
import ZplPreview from '../modals/ZplPreview';
import VariablesPanel from '../VariablesPanel';
import PrintJobsPanel from '../PrintJobsPanel';
import PrintersAdmin from '../PrintersAdmin';
import { enqueueJob } from '../../services/printQueue';
import { loadVariables } from '../../services/variables';

export const Toolbar = () => {
  const { addElement, clearElements, elements, setElements } = useCanvasStore();
  const [templates, setTemplates] = useState(() => listTemplates());
  const [previewZpl, setPreviewZpl] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string,string>>(() => loadVariables());
  const [pendingCount, setPendingCount] = useState<number>(() => countPending());
  const labelWidthMm = useCanvasStore(state => state.labelWidthMm);
  const labelHeightMm = useCanvasStore(state => state.labelHeightMm);
  const setLabelSize = useCanvasStore(state => state.setLabelSize);

  useEffect(() => {
    const id = setInterval(() => setPendingCount(countPending()), 2000);
    return () => clearInterval(id);
  }, []);

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
    const zpl = generateZPL(elements, labelWidthMm, labelHeightMm, 203, variables);
    const pw = Math.round((labelWidthMm / 25.4) * 203);
    const ll = Math.round((labelHeightMm / 25.4) * 203);
    console.log('--- ZPL GENERADO ---');
    console.log('Label(mm):', labelWidthMm, 'x', labelHeightMm, 'mm -> PW dots:', pw, 'LL dots:', ll);
    console.log(zpl);
    notify(`ZPL generado: ${labelWidthMm}x${labelHeightMm}mm -> PW=${pw} LL=${ll}`, 'info');
    setPreviewZpl(zpl);
  };

  const handleSaveTemplate = () => {
    const name = window.prompt('Nombre para la plantilla:');
    if (!name) return;
    saveTemplate(name, elements, variables, labelWidthMm, labelHeightMm);
    setTemplates(listTemplates());
    notify('Plantilla guardada', 'success');
  };

  const handleLoadTemplate = (name: string) => {
    const tpl = loadTemplate(name);
    if (!tpl) {
      alert('Plantilla no encontrada');
      return;
    }
    setElements(tpl.elements);
    if (tpl.variables) setVariables(tpl.variables);
    if (tpl.widthMm || tpl.heightMm) setLabelSize(tpl.widthMm ?? labelWidthMm, tpl.heightMm ?? labelHeightMm);
    setTemplates(listTemplates());
  };

  const [printerIp, setPrinterIp] = useState('');

  useEffect(() => {
    const def = getDefaultPrinter();
    if (def) setPrinterIp(def.ip);
  }, []);

  const handlePrint = async () => {
    console.log('[Toolbar] handlePrint clicked, printerIp=', printerIp);
    let ipToUse = printerIp;
    if (!ipToUse) {
      const def = getDefaultPrinter();
      if (def) ipToUse = def.ip;
      else {
        const printers = listPrinters();
        if (printers.length === 0) {
          setShowPrinters(true);
          notify('No hay impresoras registradas. Abre "Administrar Impresoras" para agregar una.', 'warn');
          return;
        }
        notify('Ingresa la IP de la impresora', 'info');
        return;
      }
    }
    const zpl = generateZPL(elements, labelWidthMm, labelHeightMm, 203, variables);
    notify('Iniciando impresión...', 'info');
    try {
      const res = await sendToPrinter(ipToUse, zpl, 9100);
      if (res.ok) {
        notify('Enviado a la impresora', 'success');
      } else {
        notify(`Fallo al imprimir: ${res.reason}`, 'error');
        console.error('Print failed:', res.reason);
        if (confirm(`Fallo al imprimir: ${res.reason}. ¿Descargar ZPL para envío manual?`)) {
          handleDownloadZpl(zpl);
        }
      }
    } catch (err) {
      notify('Error inesperado al intentar imprimir', 'error');
      console.error('Unexpected print error', err);
      if (confirm(`Error inesperado al imprimir: ${String(err)}. ¿Descargar ZPL para envío manual?`)) {
        handleDownloadZpl(zpl);
      }
    }
  };

  const [showJobs, setShowJobs] = useState(false);
  const [showPrinters, setShowPrinters] = useState(false);

  const handleEnqueue = () => {
    let ipToUse = printerIp;
    if (!ipToUse) {
      const def = getDefaultPrinter();
      if (def) ipToUse = def.ip;
      else {
        const printers = listPrinters();
        if (printers.length === 0) {
          setShowPrinters(true);
          return alert('No hay impresoras registradas. Abre "Administrar Impresoras" para agregar una.');
        }
        return alert('Ingresa la IP de la impresora');
      }
    }
    const zpl = generateZPL(elements, labelWidthMm, labelHeightMm, 203, variables);
    enqueueJob(ipToUse, zpl, 'Manual print');
    notify('Trabajo agregado a la cola', 'success');
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

  const [showTemplates, setShowTemplates] = useState(false);
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="flex flex-col w-72 bg-slate-800 border-r border-slate-700 h-full overflow-hidden shrink-0 z-10 shadow-lg">
      <div className="p-5 border-b border-slate-700 shrink-0">
        <h2 className="text-lg font-bold text-white">Herramientas</h2>
      </div>

      <div className="p-5 flex flex-col gap-6 overflow-y-auto h-full">
        
        {/* Elementos */}
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Elementos</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddText}
              className="flex flex-col items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 p-3 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
            >
              <Type size={20} className="text-blue-400" />
              <span className="text-xs font-medium">Texto</span>
            </button>
            <button
              onClick={handleAddBarcode}
              className="flex flex-col items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 p-3 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
            >
              <Barcode size={20} className="text-purple-400" />
              <span className="text-xs font-medium">Código</span>
            </button>
          </div>
        </section>

        <hr className="border-slate-700" />

        {/* Plantillas y Lienzo */}
        <section className="flex flex-col gap-3">
          <button 
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Plantillas</h3>
            {showTemplates ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
          </button>
          
          {showTemplates && (
            <div className="flex flex-col gap-3 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={handleSaveTemplate}
                className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 p-2 rounded-lg transition-colors text-xs border border-slate-600/50 hover:border-slate-500 justify-center"
              >
                <Save size={14} className="text-blue-400" />
                Guardar Plantilla
              </button>

              <div className="flex gap-2 items-center">
                <select
                  onChange={(e) => handleLoadTemplate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2 rounded-lg flex-1 outline-none focus:border-blue-500 transition-colors"
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
                  className="p-2 bg-slate-900 border border-slate-700 hover:border-red-900/50 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <button
                onClick={clearElements}
                className="flex items-center gap-2 mt-2 bg-transparent hover:bg-red-900/20 text-slate-400 hover:text-red-400 p-2 rounded-lg transition-colors text-xs w-full justify-center border border-transparent hover:border-red-900/30"
              >
                <Trash2 size={14} />
                Limpiar Lienzo
              </button>
            </div>
          )}
        </section>

        <hr className="border-slate-700" />

        {/* Generar / Imprimir */}
        <section className="flex flex-col gap-3">
          <button 
            onClick={() => setShowExport(!showExport)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exportación</h3>
            {showExport ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
          </button>
          
          {showExport && (
            <div className="flex flex-col gap-3 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={handleGenerateZPL}
                className="flex items-center gap-2 bg-emerald-600/90 hover:bg-emerald-500 text-white p-2.5 rounded-lg transition-colors text-xs font-medium justify-center shadow-sm"
              >
                <Play size={14} />
                Generar Código ZPL
              </button>

              <div className="flex flex-col gap-2 mt-2 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                <label className="text-[10px] text-slate-400 font-medium">IP de Impresora</label>
                <div className="flex gap-2">
                  <input value={printerIp} onChange={(e) => setPrinterIp(e.target.value)} placeholder="192.168.0.100" className="flex-1 bg-slate-900 border border-slate-700 p-1.5 rounded text-xs text-white outline-none focus:border-blue-500 transition-colors" />
                  <button type="button" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-500 transition-colors px-3 rounded text-white text-xs font-medium">Print</button>
                </div>
                
                <div className="flex gap-2 mt-1">
                  <button onClick={handleEnqueue} className="flex-1 bg-slate-700 hover:bg-slate-600 transition-colors py-1.5 rounded text-slate-200 text-[10px] font-medium border border-slate-600">A la cola</button>
                  <button onClick={() => setShowJobs(true)} className="flex-1 bg-slate-700 hover:bg-slate-600 transition-colors py-1.5 rounded text-slate-200 text-[10px] font-medium border border-slate-600 relative">
                    Ver Cola
                    {pendingCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{pendingCount}</span>}
                  </button>
                </div>
                <button onClick={() => setShowPrinters(true)} className="w-full text-center mt-2 text-[10px] text-blue-400 hover:text-blue-300 hover:underline">Administrar Impresoras</button>
              </div>
            </div>
          )}
        </section>

        <hr className="border-slate-700" />
        
        {/* Variables */}
        <section className="flex flex-col">
          <VariablesPanel onChange={(v) => setVariables(v)} />
        </section>

      </div>

      {showJobs && <PrintJobsPanel onClose={() => setShowJobs(false)} />}
      {showPrinters && <PrintersAdmin onClose={() => setShowPrinters(false)} />}
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

