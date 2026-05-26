import { useEffect, useState } from 'react';
import { listPrinters, savePrinter, deletePrinter, setDefaultPrinter, getDefaultPrinterId } from '../services/printers';
import type { PrinterEntry } from '../services/printers';

type Props = { onClose?: () => void };

export default function PrintersAdmin({ onClose }: Props) {
  const [items, setItems] = useState<PrinterEntry[]>(() => listPrinters());
  const [editing, setEditing] = useState<PrinterEntry | null>(null);
  const [defaultId, setDefaultId] = useState<string | null>(() => getDefaultPrinterId());

  useEffect(() => setItems(listPrinters()), []);

  const reload = () => setItems(listPrinters());

  const startNew = () => setEditing({ id: '', name: '', ip: '', brand: '', model: '', port: 9100, createdAt: new Date().toISOString() });

  const save = () => {
    if (!editing) return;
    if (!editing.name || !editing.ip) return alert('Nombre e IP requeridos');
    savePrinter({ id: editing.id || undefined, name: editing.name, ip: editing.ip, brand: editing.brand, model: editing.model, port: editing.port ?? 9100 });
    setEditing(null);
    reload();
    alert('Impresora guardada');
  };

  const remove = (id: string) => {
    if (!confirm('Eliminar impresora?')) return;
    deletePrinter(id);
    reload();
  };

  const toggleDefault = (id: string) => {
    const newId = defaultId === id ? null : id;
    setDefaultPrinter(newId);
    setDefaultId(newId);
    alert('Impresora por defecto actualizada');
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-slate-900 p-6 rounded-lg w-[720px] max-h-[80vh] overflow-auto border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Administración de Impresoras</h3>
          <div className="flex gap-2">
            <button onClick={startNew} className="bg-green-600 px-3 py-1 rounded">Nueva</button>
            <button onClick={() => onClose?.()} className="bg-slate-700 px-3 py-1 rounded">Cerrar</button>
          </div>
        </div>

        <table className="w-full text-sm table-auto">
          <thead>
            <tr className="text-left text-slate-300 border-b border-slate-700">
              <th>Nombre</th>
              <th>IP</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Puerto</th>
              <th>Default</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id} className="border-b border-slate-800">
                <td className="py-2">{p.name}</td>
                <td>{p.ip}</td>
                <td>{p.brand}</td>
                <td>{p.model}</td>
                <td>{p.port ?? 9100}</td>
                <td>
                  <input type="checkbox" checked={defaultId === p.id} onChange={() => toggleDefault(p.id)} />
                </td>
                <td>
                  <button onClick={() => setEditing(p)} className="text-xs mr-2 text-emerald-400">Editar</button>
                  <button onClick={() => remove(p.id)} className="text-xs text-red-400">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editing && (
          <div className="mt-4 bg-slate-800 p-4 rounded">
            <h4 className="font-semibold mb-2">{editing.id ? 'Editar' : 'Nueva'}</h4>
            <div className="grid grid-cols-2 gap-2">
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Nombre" className="p-2 bg-slate-900 rounded" />
              <input value={editing.ip} onChange={(e) => setEditing({ ...editing, ip: e.target.value })} placeholder="IP" className="p-2 bg-slate-900 rounded" />
              <input value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} placeholder="Marca" className="p-2 bg-slate-900 rounded" />
              <input value={editing.model} onChange={(e) => setEditing({ ...editing, model: e.target.value })} placeholder="Modelo" className="p-2 bg-slate-900 rounded" />
              <input value={(editing.port ?? 9100).toString()} onChange={(e) => setEditing({ ...editing, port: Number(e.target.value) })} placeholder="Puerto" className="p-2 bg-slate-900 rounded" />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={save} className="bg-emerald-600 px-3 py-1 rounded">Guardar</button>
              <button onClick={() => setEditing(null)} className="bg-slate-700 px-3 py-1 rounded">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
