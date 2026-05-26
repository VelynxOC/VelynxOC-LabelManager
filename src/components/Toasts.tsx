import { useEffect, useState } from 'react';

type ToastItem = { id: string; message: string; level: string };

export const Toasts = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      // @ts-ignore
      const d = (e as CustomEvent).detail;
      const id = crypto.randomUUID();
      setItems((s) => [...s, { id, message: d.message, level: d.level }]);
      const timeout = d.level === 'error' ? 8000 : d.level === 'success' ? 3500 : 5000;
      setTimeout(() => setItems((s) => s.filter(i => i.id !== id)), timeout);
    };
    window.addEventListener('app:toast', onToast as EventListener);
    return () => window.removeEventListener('app:toast', onToast as EventListener);
  }, []);

  const remove = (id: string) => setItems((s) => s.filter(i => i.id !== id));

  return (
    <div className="fixed right-6 top-6 flex flex-col gap-2 z-50">
      {items.map(it => (
        <div key={it.id} className={`px-4 py-2 rounded shadow flex items-center justify-between gap-4 ${it.level === 'error' ? 'bg-red-600 text-white' : it.level === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 flex items-center justify-center">
              {it.level === 'error' ? '⚠️' : it.level === 'success' ? '✅' : '🔔'}
            </div>
            <div className="text-sm">{it.message}</div>
          </div>
          <button onClick={() => remove(it.id)} className="text-xs opacity-80">Cerrar</button>
        </div>
      ))}
    </div>
  );
};

export default Toasts;
