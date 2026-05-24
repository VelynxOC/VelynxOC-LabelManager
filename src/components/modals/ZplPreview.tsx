export const ZplPreview = ({ zpl, onClose, onCopy, onDownload }: { zpl: string; onClose: () => void; onCopy: () => void; onDownload: () => void; }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-[900px] max-w-full p-6 rounded-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Vista previa ZPL</h3>
          <div className="flex gap-2">
            <button onClick={onCopy} className="bg-blue-600 text-white px-3 py-1 rounded">Copiar</button>
            <button onClick={onDownload} className="bg-emerald-600 text-white px-3 py-1 rounded">Descargar</button>
            <button onClick={onClose} className="bg-red-600 text-white px-3 py-1 rounded">Cerrar</button>
          </div>
        </div>

        <pre className="overflow-auto max-h-[60vh] p-3 bg-black text-white rounded text-xs">
          {zpl}
        </pre>
      </div>
    </div>
  );
};

export default ZplPreview;
