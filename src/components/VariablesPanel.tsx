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
    <div className="mt-4">
      <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
        <span>Variables</span>
        <button onClick={addVar} className="text-xs bg-slate-700 px-2 py-1 rounded">Agregar</button>
      </div>
      <div className="flex flex-col gap-2 max-h-40 overflow-auto">
        {entries.length === 0 && <div className="text-xs text-slate-400">No hay variables</div>}
        {entries.map(([k,v]) => (
          <div key={k} className="flex gap-2">
            <input value={k} onChange={(e) => updateKey(k, e.target.value)} className="flex-[0.6] bg-slate-900 p-2 rounded text-white" />
            <input value={v} onChange={(e) => updateValue(k, e.target.value)} className="flex-1 bg-slate-900 p-2 rounded text-white" />
            <button onClick={() => removeVar(k)} className="ml-2 text-red-400">Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VariablesPanel;
