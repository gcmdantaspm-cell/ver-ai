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
    <div className="flex flex-col h-screen bg-[#F0F4F8] font-sans text-slate-900 overflow-hidden relative">
      
      {/* Top Navbar */}
      <header className="h-16 bg-[#0B132B] flex items-center justify-between px-4 md:px-8 z-40 border-b border-[#1C2541] shrink-0">
         <div className="flex items-center gap-8">
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('dashboard')}>
                <div className="w-3.5 h-3.5 bg-blue-500 rounded-full"></div>
                <h1 className="font-bold text-white tracking-tight uppercase text-lg">VER.AI</h1>
             </div>

             <nav className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigateTo("dashboard")}
                  className={`px-4 py-2 rounded text-xs font-semibold transition-colors flex items-center gap-2 ${currentView === "dashboard" ? "bg-[#1C2541] text-blue-400" : "text-slate-400 hover:bg-[#1C2541]/50 hover:text-white"}`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Painel Geral
                </button>
                <button
                  onClick={() => navigateTo("import")}
                  className={`px-4 py-2 rounded text-xs font-semibold transition-colors flex items-center gap-2 ${currentView === "import" ? "bg-[#1C2541] text-blue-400" : "text-slate-400 hover:bg-[#1C2541]/50 hover:text-white"}`}
                >
                  <Plus className="w-4 h-4" /> Adicionar Edital
                </button>
             </nav>
         </div>

         <div className="hidden md:flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Meus Editais:</span>
            <div className="relative">
               <select 
                  className="appearance-none bg-[#1C2541] focus:bg-[#253256] border border-blue-500/30 hover:border-blue-500/60 text-white text-xs font-medium rounded-lg pl-4 pr-10 py-2 outline-none cursor-pointer w-64 transition-colors"
                  value={currentView.startsWith('edital-') ? currentView.replace('edital-', '') : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) navigateTo(`edital-${val}`);
                  }}
               >
                  <option value="" disabled>Selecione um edital...</option>
                  {editais.map(e => <option key={e.id} value={e.id}>{e.titulo}</option>)}
               </select>
               <ChevronDown className="w-4 h-4 text-blue-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
         </div>

         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-300 hover:text-white">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
         </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 max-h-[80vh] overflow-y-auto bg-[#0B132B] border-b border-[#1C2541] z-30 flex flex-col p-4 shadow-xl animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => navigateTo("dashboard")}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-3 text-sm font-medium mb-2 ${currentView === "dashboard" ? "bg-[#1C2541] text-blue-400" : "text-slate-300"}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Painel Geral</span>
            </button>
            <button
               onClick={() => navigateTo("import")}
              className={`w-full text-left px-4 py-3 rounded flex items-center space-x-3 text-sm font-medium mb-6 ${currentView === "import" ? "bg-[#1C2541] text-blue-400" : "text-slate-300"}`}
            >
               <Plus className="w-5 h-5" />
               <span>Adicionar Edital</span>
            </button>
            
            <div className="px-4 mb-2">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Meus Editais</span>
            </div>
            {editais.map(edital => (
               <button
                 key={edital.id}
                 onClick={() => navigateTo(`edital-${edital.id}`)}
                 className={`w-full text-left px-4 py-3 rounded flex items-center space-x-3 text-sm font-medium mb-1 ${currentView === `edital-${edital.id}` ? "bg-[#1C2541] text-blue-400" : "text-slate-300"}`}
               >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate">{edital.titulo}</span>
               </button>
            ))}
        </div>
      )}

      {/* Mobile overlay */}
      {mobileMenuOpen && <div className="md:hidden fixed inset-0 top-16 bg-black/60 z-20" onClick={() => setMobileMenuOpen(false)}></div>}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden h-full">
         {currentView === "dashboard" && <Dashboard />}
         {currentView === "import" && <ParseEdital onSuccess={() => navigateTo("dashboard")} />}
         {currentView.startsWith("edital-") && (
            <EditalView 
               key={currentView} // Force remount if selecting different edital
               edital={editais.find(e => e.id === currentView.replace("edital-", ""))!} 
            />
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

