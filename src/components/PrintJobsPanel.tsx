import { useEffect, useState } from 'react';
import { listJobs, removeJob, retryJob, clearJobs, cancelJob, updateJob } from '../services/printQueue';

export const PrintJobsPanel = ({ onClose }: { onClose: () => void }) => {
  const [jobs, setJobs] = useState(() => listJobs());

  useEffect(() => {
    const id = setInterval(() => setJobs(listJobs()), 800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed right-6 top-6 w-96 bg-slate-900 p-4 rounded shadow-lg border border-slate-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold">Cola de impresión</h3>
        <div className="flex gap-2">
          <button onClick={() => { clearJobs(); setJobs([]); }} className="text-xs text-red-400">Limpiar</button>
          <button onClick={onClose} className="text-xs text-slate-300">Cerrar</button>
        </div>
      </div>
      <div className="max-h-80 overflow-auto">
        {jobs.length === 0 && <div className="text-slate-400 text-sm">Sin trabajos</div>}
        {jobs.map(j => (
          <div key={j.id} className="mb-2 p-2 bg-slate-800 rounded">
            <div className="flex justify-between text-sm text-slate-300">
              <div>{j.name ?? j.id.slice(0,6)}</div>
              <div className="text-xs">{j.status}</div>
            </div>
            <div className="text-xs text-slate-400">IP: {j.ip} · Intentos: {j.attempts}</div>
            {j.lastError && <div className="text-xs text-red-400">Error: {j.lastError}</div>}
            <div className="flex gap-2 mt-2 items-center">
              <label className="text-xs text-slate-400">Prioridad</label>
              <select value={(j.priority ?? 0).toString()} onChange={(e) => { updateJob(j.id, { priority: Number(e.target.value) }); setJobs(listJobs()); }} className="text-xs bg-slate-900 p-1 rounded">
                <option value="2">Alta</option>
                <option value="1">Normal</option>
                <option value="0">Baja</option>
              </select>
              <button onClick={() => {
                if (j.status === 'in-progress') return alert('No se puede cancelar trabajo en progreso');
                if (!confirm('Confirmar cancelar trabajo?')) return;
                cancelJob(j.id);
                setJobs(listJobs());
              }} className="text-xs text-yellow-300">Cancelar</button>
              <button onClick={() => { retryJob(j.id); setJobs(listJobs()); }} className="text-xs bg-emerald-600 px-2 rounded">Reintentar</button>
              <button onClick={() => { if (!confirm('Eliminar trabajo?')) return; removeJob(j.id); setJobs(listJobs()); }} className="text-xs text-red-400">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintJobsPanel;
