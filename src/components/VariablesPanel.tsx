import { useState, useCallback } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';

/**
 * Fila individual de variable.
 * Maneja el nombre con estado local para evitar que React destruya
 * el input en cada keystroke (el key del objeto cambia al renombrar).
 * El rename real se aplica solo al perder el foco (onBlur).
 */
const VariableRow = ({
  varKey,
  varValue,
  onRename,
  onValueChange,
  onRemove,
}: {
  varKey: string;
  varValue: string;
  onRename: (oldKey: string, newKey: string) => void;
  onValueChange: (key: string, value: string) => void;
  onRemove: (key: string) => void;
}) => {
  const [localKey, setLocalKey] = useState(varKey);

  // Si la clave cambia desde afuera (p.ej. carga de plantilla) sincronizamos
  // sin perder el foco porque el componente no se desmonta.
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalKey(e.target.value);
  };

  const handleKeyBlur = () => {
    const trimmed = localKey.trim();
    if (trimmed && trimmed !== varKey) {
      onRename(varKey, trimmed);
    } else if (!trimmed) {
      // Si quedó vacío, revertir al nombre anterior
      setLocalKey(varKey);
    }
  };

  return (
    <div className="flex gap-1.5 items-center">
      <input
        value={localKey}
        onChange={handleKeyChange}
        onBlur={handleKeyBlur}
        className="w-1/3 bg-slate-900 border border-slate-700 focus:border-amber-500 p-1.5 rounded text-xs text-amber-300 outline-none transition-colors font-mono"
        placeholder="clave"
        spellCheck={false}
      />
      <input
        value={varValue}
        onChange={(e) => onValueChange(varKey, e.target.value)}
        className="flex-1 bg-slate-900 border border-slate-700 focus:border-blue-500 p-1.5 rounded text-xs text-white outline-none transition-colors"
        placeholder="valor"
      />
      <button
        onClick={() => onRemove(varKey)}
        className="text-slate-500 hover:text-red-400 p-1 transition-colors shrink-0"
        title="Eliminar variable"
      >
        ✕
      </button>
    </div>
  );
};

export const VariablesPanel = () => {
  const variables = useCanvasStore((s) => s.variables);
  const setVariables = useCanvasStore((s) => s.setVariables);
  const entries = Object.entries(variables);

  const handleRename = useCallback((oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    const copy = { ...variables };
    const val = copy[oldKey];
    delete copy[oldKey];
    copy[newKey] = val ?? '';
    setVariables(copy);
  }, [variables, setVariables]);

  const handleValueChange = useCallback((key: string, value: string) => {
    setVariables({ ...variables, [key]: value });
  }, [variables, setVariables]);

  const handleRemove = useCallback((key: string) => {
    const copy = { ...variables };
    delete copy[key];
    setVariables(copy);
  }, [variables, setVariables]);

  const addVar = () => {
    const copy: Record<string, string> = { ...variables };
    let i = 1;
    let k = 'variable';
    while (copy[k]) k = `variable${i++}`;
    copy[k] = '';
    setVariables(copy);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
        <span>Variables</span>
        <button
          onClick={addVar}
          className="text-[10px] bg-slate-700 hover:bg-slate-600 transition-colors px-2 py-1 rounded text-slate-200 border border-slate-600"
        >
          + Añadir
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-slate-500 italic">
          Define variables para usar en elementos de texto o código de barras con la sintaxis{' '}
          <code className="text-blue-400 bg-slate-900 px-1 rounded">{'{{nombre}}'}</code>
        </p>
      ) : (
        <div className="flex flex-col gap-2 max-h-48 overflow-auto pr-1">
          {entries.map(([k, v]) => (
            <VariableRow
              key={k}
              varKey={k}
              varValue={v}
              onRename={handleRename}
              onValueChange={handleValueChange}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {entries.length > 0 && (
        <p className="text-[10px] text-slate-500 mt-2 italic">
          Usa <code className="text-blue-400 bg-slate-900 px-1 rounded">{'{{clave}}'}</code> en cualquier elemento de texto o barcode.
        </p>
      )}
    </div>
  );
};

export default VariablesPanel;
