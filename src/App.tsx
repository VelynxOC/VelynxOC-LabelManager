import { LabelCanvas } from './components/canvas/LabelCanvas';
import { Toolbar } from './components/toolbar/Toolbar';
import { PropertiesPanel } from './components/properties/PropertiesPanel';
import { Printer } from 'lucide-react';
import Toasts from './components/Toasts';

function App() {
  return (
    <div className="h-screen w-full bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      <header className="flex items-center gap-3 px-6 py-3 bg-slate-800 border-b border-slate-700 shrink-0 z-10 shadow-sm">
        <div className="p-2 bg-blue-600 rounded-lg shadow-inner">
          <Printer size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent leading-none">LabelFlow</h1>
          <p className="text-slate-400 text-xs mt-1">Plataforma SaaS de Diseño e Impresión</p>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <Toolbar />
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900 relative">
          <div className="flex-1 min-h-0 flex p-6">
            <LabelCanvas />
          </div>
        </div>
        <PropertiesPanel />
      </main>
      <Toasts />
    </div>
  );
}

export default App;
