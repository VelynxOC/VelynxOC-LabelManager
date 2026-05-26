import { useState } from 'react';
import { loadVariables, saveVariables } from '../services/variables';

export const VariablesPanel = ({ onChange }: { onChange?: (vars: Record<string,string>) => void }) => {
  const [vars, setVars] = useState<Record<string,string>>(() => loadVariables());
  const entries = Object.entries(vars);

  const updateKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    const copy = { ...vars };
    const val = copy[oldKey];
    delete copy[oldKey];
    if (newKey) copy[newKey] = val ?? '';
    setVars(copy);
    saveVariables(copy);
    onChange?.(copy);
  };

  const updateValue = (key: string, value: string) => {
    const copy = { ...vars, [key]: value };
    setVars(copy);
    saveVariables(copy);
    onChange?.(copy);
  };

  const addVar = () => {
    const copy: Record<string,string> = { ...vars };
    // avoid collisions
    let i = 1;
    let k = 'nuevo';
    while (copy[k]) {
      k = `nuevo${i++}`;
    }
    copy[k] = '';
    setVars(copy);
    saveVariables(copy);
    onChange?.(copy);
  };

  const removeVar = (key: string) => {
    const copy = { ...vars };
    delete copy[key];
    setVars(copy);
    saveVariables(copy);
    onChange?.(copy);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
        <span>Variables</span>
        <button onClick={addVar} className="text-[10px] bg-slate-700 hover:bg-slate-600 transition-colors px-2 py-1 rounded text-slate-200 border border-slate-600">+ Añadir</button>
      </div>
      <div className="flex flex-col gap-2 max-h-40 overflow-auto pr-1">
        {entries.length === 0 && <div className="text-xs text-slate-500 italic">No hay variables definidas.</div>}
        {entries.map(([k,v]) => (
          <div key={k} className="flex gap-1.5 items-center">
            <input value={k} onChange={(e) => updateKey(k, e.target.value)} className="w-1/3 bg-slate-900 border border-slate-700 focus:border-blue-500 p-1.5 rounded text-xs text-white outline-none transition-colors" placeholder="Llave" />
            <input value={v} onChange={(e) => updateValue(k, e.target.value)} className="w-1/2 bg-slate-900 border border-slate-700 focus:border-blue-500 p-1.5 rounded text-xs text-white outline-none transition-colors" placeholder="Valor" />
            <button onClick={() => removeVar(k)} className="text-slate-500 hover:text-red-400 p-1 transition-colors" title="Eliminar variable">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VariablesPanel;
