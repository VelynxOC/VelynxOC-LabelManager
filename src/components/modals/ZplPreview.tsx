import { useEffect, useState } from 'react';
import { renderLabelary } from '../../services/labelary';
import { useCanvasStore } from '../../store/useCanvasStore';

export const ZplPreview = ({ zpl, onClose, onCopy, onDownload }: { zpl: string; onClose: () => void; onCopy: () => void; onDownload: () => void; }) => {
  const labelWidthMm = useCanvasStore(s => s.labelWidthMm);
  const labelHeightMm = useCanvasStore(s => s.labelHeightMm);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setImgUrl(null);
    renderLabelary(zpl, labelWidthMm, labelHeightMm, 203).then(r => {
      if (!mounted) return;
      setLoading(false);
      if (!r.ok) {
        setError(r.reason);
        return;
      }
      setImgUrl(r.url);
    }).catch(e => {
      if (!mounted) return;
      setLoading(false);
      setError(String(e));
    });
    return () => { mounted = false; if (imgUrl) URL.revokeObjectURL(imgUrl); };
  }, [zpl, labelWidthMm, labelHeightMm]);

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

        <div className="grid grid-cols-2 gap-4">
          <pre className="overflow-auto max-h-[60vh] p-3 bg-black text-white rounded text-xs">
            {zpl}
          </pre>
          <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded">
            {loading && <div className="p-6">Generando preview...</div>}
            {error && <div className="p-4 text-red-500">Preview no disponible: {error}</div>}
            {imgUrl && <img src={imgUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '60vh' }} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZplPreview;
