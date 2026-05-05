import { useState } from "react";
import { EditalProvider, useEdital } from "./store";
import { Dashboard } from "./components/Dashboard";
import { ParseEdital } from "./components/ParseEdital";
import { EditalView } from "./components/EditalView";
import { FloatingPomodoro } from "./components/Pomodoro";
import { LayoutDashboard, FileText, Plus, BookOpen, Menu, X, ChevronDown } from "lucide-react";

function AppContent() {
  const { editais } = useEdital();
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (view: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#F5F7FA] font-sans text-slate-800 overflow-hidden relative">
      
      {/* Sidebar on Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 z-40 shrink-0">
         <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('dashboard')}>
                <div className="w-5 h-5 bg-indigo-600 rounded-lg"></div>
                <h1 className="font-display font-bold text-slate-900 tracking-tight text-xl">VER.AI</h1>
             </div>
         </div>

         <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Principal</span>
            <button
              onClick={() => navigateTo("dashboard")}
              className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${currentView === "dashboard" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Painel Geral
            </button>
            <button
              onClick={() => navigateTo("import")}
              className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${currentView === "import" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <Plus className="w-4 h-4" /> Novo Edital
            </button>

            {editais.length > 0 && (
              <>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mt-6 mb-2">Meus Editais</span>
                {editais.map(e => (
                  <button
                    key={e.id}
                    onClick={() => navigateTo(`edital-${e.id}`)}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${currentView === `edital-${e.id}` ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span className="truncate text-left flex-1">{e.titulo}</span>
                  </button>
                ))}
              </>
            )}
         </nav>
      </aside>

      {/* Mobile Top Navbar */}
      <header className="md:hidden h-16 bg-white flex items-center justify-between px-4 z-40 border-b border-slate-200 shrink-0 absolute top-0 left-0 right-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('dashboard')}>
            <div className="w-4 h-4 bg-indigo-600 rounded-lg"></div>
            <h1 className="font-display font-bold text-slate-900 tracking-tight text-lg">VER.AI</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600 hover:text-slate-900">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bottom-0 bg-white z-30 flex flex-col p-4 shadow-xl animate-in fade-in slide-in-from-top-2 overflow-y-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Principal</span>
            <button
              onClick={() => navigateTo("dashboard")}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 ${currentView === "dashboard" ? "bg-indigo-50 text-indigo-700" : "text-slate-600"}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Painel Geral</span>
            </button>
            <button
               onClick={() => navigateTo("import")}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-6 ${currentView === "import" ? "bg-indigo-50 text-indigo-700" : "text-slate-600"}`}
            >
               <Plus className="w-5 h-5" />
               <span>Novo Edital</span>
            </button>
            
            {editais.length > 0 && (
              <>
                <div className="px-2 mb-2 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Meus Editais</span>
                </div>
                {editais.map(edital => (
                  <button
                    key={edital.id}
                    onClick={() => navigateTo(`edital-${edital.id}`)}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 ${currentView === `edital-${edital.id}` ? "bg-indigo-50 text-indigo-700" : "text-slate-600"}`}
                  >
                      <BookOpen className="w-5 h-5 shrink-0" />
                      <span className="truncate">{edital.titulo}</span>
                  </button>
                ))}
              </>
            )}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden h-full pt-16 md:pt-0">
         {currentView === "dashboard" && <Dashboard />}
         {currentView === "import" && <ParseEdital onSuccess={() => navigateTo("dashboard")} />}
         {currentView.startsWith("edital-") && (
            (() => {
               const foundEdital = editais.find(e => e.id === currentView.replace("edital-", ""));
               if (!foundEdital) return null;
               return <EditalView key={currentView} edital={foundEdital} />;
            })()
         )}
      </main>
      
      <FloatingPomodoro />
    </div>
  );
}

export default function App() {
  return (
    <EditalProvider>
      <AppContent />
    </EditalProvider>
  );
}

