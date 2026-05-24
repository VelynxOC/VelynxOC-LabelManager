import { LabelCanvas } from './components/canvas/LabelCanvas';
import { Toolbar } from './components/toolbar/Toolbar';
import { PropertiesPanel } from './components/properties/PropertiesPanel';
import { Printer } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col font-sans">
      <header className="flex items-center gap-3 mb-10">
        <div className="p-3 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
          <Printer size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">LabelFlow</h1>
          <p className="text-slate-400 text-sm">Plataforma SaaS de Diseño e Impresión</p>
        </div>
      </header>

      <main className="flex gap-6 flex-1">
        <Toolbar />
        <div className="flex-1 flex flex-col items-center">
          <div className="mb-4 text-slate-300 w-full max-w-[600px]">
            <h2 className="text-xl font-semibold">Lienzo de Diseño</h2>
            <p className="text-sm text-slate-500">Arrastra elementos para diseñar tu etiqueta. Selecciona un elemento para editarlo.</p>
          </div>
          <LabelCanvas />
        </div>
        <PropertiesPanel />
      </main>
    </div>
  );
}

export default App;
