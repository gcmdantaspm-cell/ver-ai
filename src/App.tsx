import { useState, useEffect, useRef } from "react";
import { EditalProvider, useEdital } from "./store";
import { Dashboard } from "./components/Dashboard";
import { ParseEdital } from "./components/ParseEdital";
import { EditalView } from "./components/EditalView";
import { RevisaoSugestoes } from "./components/RevisaoSugestoes";
import { DiscursivasView } from "./components/DiscursivasView";
import { StudyCycles } from "./components/StudyCycles";
import { FloatingPomodoro } from "./components/Pomodoro";
import { SharedHub } from "./components/SharedHub";
import { CartoesView } from "./components/CartoesView";
import { CartoesErrosView } from "./components/CartoesErrosView";
import {  LayoutDashboard, FileText, Plus, BookOpen, Menu, X, ChevronDown, LogOut, Loader2, History, Target, Users, Layers, AlertTriangle , Pin, PenTool } from "lucide-react";
import { useAuth } from "./AuthContext";
import { v4 as uuidv4 } from "uuid";
import { query, collection, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function AppContent() {
  const { editais, getPublicEdital, addEdital, getPublicCiclos, addCiclo, pinnedEditalId, setPinnedEditalId } = useEdital();
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const importProcessed = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const importId = params.get('import');
    const importCiclos = params.get('ciclos');
    
    if (importId && user && importProcessed.current !== importId) {
      importProcessed.current = importId;
      const handleImport = async () => {
         setIsImporting(true);
         try {
            // Check if we already have this edital imported (query DB directly)
            const qEdital1 = query(collection(db, "editais"), where("userId", "==", user.uid), where("originalEditalId", "==", importId));
            const qEdital2 = query(collection(db, "editais"), where("userId", "==", user.uid));
            const editalSnap1 = await getDocs(qEdital1);
            
            let existingEditalId: string | null = null;
            if (!editalSnap1.empty) {
               existingEditalId = editalSnap1.docs[0].id;
            } else {
               const editalSnap2 = await getDocs(qEdital2);
               const ext = editalSnap2.docs.find(d => d.id === importId);
               if (ext) existingEditalId = ext.id;
            }
            
            let targetEditalId = "";

            if (!existingEditalId) {
              const ed = await getPublicEdital(importId);
              if (ed) {
                const clone = JSON.parse(JSON.stringify(ed));
                clone.id = uuidv4();
                clone.originalEditalId = importId;
                clone.importedFrom = ed.ownerName;
                clone.isPublic = false;
                clone.userId = user.uid;
                clone.managedBy = ed.userId;
                clone.copiedByEmail = user.email || "";
                clone.copiedByName = user.displayName || "";
                addEdital(clone);
                targetEditalId = clone.id;
              } else {
                alert("Edital não encontrado ou não está público.");
                window.history.replaceState({}, document.title, "/");
                setIsImporting(false);
                return;
              }
            } else {
              targetEditalId = existingEditalId;
            }

            // At this point, targetEditalId is the ID of the edital (new or existing)
            // Now import the cycles
            const pCiclos = await getPublicCiclos(importId);
            const requestedIds = importCiclos ? importCiclos.split(',') : [];

            const qCiclos = query(collection(db, "ciclos"), where("userId", "==", user.uid));
            const existingCiclosSnap = await getDocs(qCiclos);
            const existingCicloIds = existingCiclosSnap.docs.map(d => d.id);
            const existingOriginalIds = existingCiclosSnap.docs.map(d => d.data().originalCycleId).filter(Boolean);

            for (const c of pCiclos) {
               if (requestedIds.length > 0 && !requestedIds.includes(c.id)) {
                  continue;
               }
               
               if (existingCicloIds.includes(c.id) || existingOriginalIds.includes(c.id)) {
                  continue; // already have it
               }
               
               const cicloClone = JSON.parse(JSON.stringify(c));
               cicloClone.id = uuidv4();
               cicloClone.originalCycleId = c.id;
               cicloClone.editalId = targetEditalId; // Correct link!
               cicloClone.isPublic = false;
               cicloClone.userId = user.uid;
               cicloClone.managedBy = c.userId;
               cicloClone.copiedByEmail = user.email || "";
               cicloClone.copiedByName = user.displayName || "";
               addCiclo(cicloClone);
            }

            // Remove param from url
            window.history.replaceState({}, document.title, "/");
            if (targetEditalId) setCurrentView(`edital-${targetEditalId}`);
         } catch(e) {
            console.error(e);
            alert("Erro ao importar edital.");
         } finally {
            setIsImporting(false);
         }
      };
      handleImport();
    }
  }, [user, getPublicEdital, addEdital, getPublicCiclos, addCiclo]);

  const navigateTo = (view: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      {isImporting && (
         <div className="absolute inset-0 z-50 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-900 mb-4" />
            <span className="text-sm font-bold text-slate-900 animate-pulse">Importando Edital...</span>
         </div>
      )}
      {/* Sidebar on Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 z-40 shrink-0">
         <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('dashboard')}>
                <div className="w-5 h-5 bg-blue-900 rounded-lg shadow-sm shadow-blue-900/20"></div>
                <h1 className="font-display font-bold text-slate-900 tracking-tight text-xl">VER.AI</h1>
             </div>
         </div>

         <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Principal</span>
            <button
              onClick={() => navigateTo("dashboard")}
              className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${currentView === "dashboard" ? "bg-blue-900 text-white shadow-md shadow-blue-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent"}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Painel Geral
            </button>
            <button
              onClick={() => navigateTo("revisao")}
              className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${currentView === "revisao" ? "bg-blue-900 text-white shadow-md shadow-blue-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent"}`}
            >
              <History className="w-4 h-4" /> Revisão Inteligente
            </button>
            <button
              onClick={() => navigateTo("ciclos")}
              className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${currentView === "ciclos" ? "bg-blue-900 text-white shadow-md shadow-blue-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent"}`}
            >
              <Target className="w-4 h-4" /> Ciclos de Estudos
            </button>
            <button
              onClick={() => navigateTo("shared")}
              className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${currentView === "shared" ? "bg-blue-900 text-white shadow-md shadow-blue-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent"}`}
            >
              <Users className="w-4 h-4" /> Compartilhados
            </button>
            <button
              onClick={() => navigateTo("cartoes")}
              className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${currentView === "cartoes" ? "bg-blue-900 text-white shadow-md shadow-blue-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent"}`}
            >
              <Layers className="w-4 h-4" /> Cartões Inteligentes
            </button>
            <button
              onClick={() => navigateTo("cartoes_erros")}
              className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${currentView === "cartoes_erros" ? "bg-blue-900 text-white shadow-md shadow-blue-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent"}`}
            >
              <AlertTriangle className="w-4 h-4" /> Flashcards de Erros
            </button>
            <button
              onClick={() => navigateTo("discursivas")}
              className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${currentView === "discursivas" ? "bg-blue-900 text-white shadow-md shadow-blue-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent"}`}
            >
              <PenTool className="w-4 h-4" /> Mapa da Discursiva
            </button>
            <button
              onClick={() => navigateTo("import")}
              className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${currentView === "import" ? "bg-blue-900 text-white shadow-md shadow-blue-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent"}`}
            >
              <Plus className="w-4 h-4" /> Cadastrar / Importar
            </button>

            {editais.length > 0 && (
              <>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mt-6 mb-2">Meus Editais</span>
                {editais.map(e => (
                  <button
                    key={e.id}
                    onClick={() => navigateTo(`edital-${e.id}`)}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${currentView === `edital-${e.id}` ? "bg-blue-900 text-white shadow-md shadow-blue-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent"}`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span className="truncate text-left flex-1">{e.titulo}</span>
                  </button>
                ))}
              </>
            )}
         </nav>
         <div className="p-4 border-t border-slate-200">
           <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <LogOut className="w-4 h-4" /> Sair
           </button>
         </div>
      </aside>

      {/* Mobile Top Navbar */}
      <header className="md:hidden h-16 bg-white flex items-center justify-between px-4 z-40 border-b border-slate-200 shrink-0 absolute top-0 left-0 right-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-400 hover:text-slate-900">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('dashboard')}>
              <div className="w-4 h-4 bg-blue-900 rounded-lg shadow-sm shadow-blue-900/20"></div>
              <h1 className="font-display font-bold text-slate-900 tracking-tight text-lg">VER.AI</h1>
            </div>
          </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bottom-0 bg-white z-30 flex flex-col p-4 shadow-xl animate-in fade-in slide-in-from-top-2 overflow-y-auto">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2 mt-2">Principal</span>
            <button
              onClick={() => navigateTo("dashboard")}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 border ${currentView === "dashboard" ? "bg-blue-900 text-white shadow-md border-transparent" : "text-slate-500 hover:bg-slate-100 border-transparent"}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Painel Geral</span>
            </button>
            <button
              onClick={() => navigateTo("revisao")}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 border ${currentView === "revisao" ? "bg-blue-900 text-white shadow-md border-transparent" : "text-slate-500 hover:bg-slate-100 border-transparent"}`}
            >
              <History className="w-5 h-5" />
              <span>Revisão Inteligente</span>
            </button>
            <button
              onClick={() => navigateTo("ciclos")}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 border ${currentView === "ciclos" ? "bg-blue-900 text-white shadow-md border-transparent" : "text-slate-500 hover:bg-slate-100 border-transparent"}`}
            >
              <Target className="w-5 h-5" />
              <span>Ciclos de Estudos</span>
            </button>
            <button
              onClick={() => navigateTo("shared")}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 border ${currentView === "shared" ? "bg-blue-900 text-white shadow-md border-transparent" : "text-slate-500 hover:bg-slate-100 border-transparent"}`}
            >
              <Users className="w-5 h-5" />
              <span>Compartilhados</span>
            </button>
            <button
              onClick={() => navigateTo("cartoes")}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 border ${currentView === "cartoes" ? "bg-blue-900 text-white shadow-md border-transparent" : "text-slate-500 hover:bg-slate-100 border-transparent"}`}
            >
              <Layers className="w-5 h-5" />
              <span>Cartões Inteligentes</span>
            </button>
            <button
              onClick={() => navigateTo("cartoes_erros")}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 border ${currentView === "cartoes_erros" ? "bg-blue-900 text-white shadow-md border-transparent" : "text-slate-500 hover:bg-slate-100 border-transparent"}`}
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Flashcards de Erros</span>
            </button>
            <button
              onClick={() => navigateTo("discursivas")}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 border ${currentView === "discursivas" ? "bg-blue-900 text-white shadow-md border-transparent" : "text-slate-500 hover:bg-slate-100 border-transparent"}`}
            >
              <PenTool className="w-5 h-5" />
              <span>Mapa da Discursiva</span>
            </button>
            <button
               onClick={() => navigateTo("import")}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-6 border ${currentView === "import" ? "bg-blue-900 text-white shadow-md border-transparent" : "text-slate-500 hover:bg-slate-100 border-transparent"}`}
            >
               <Plus className="w-5 h-5" />
               <span>Cadastrar / Importar</span>
            </button>
            
            {editais.length > 0 && (
              <>
                <div className="px-2 mb-2 mt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Meus Editais</span>
                </div>
                {editais.map(edital => (
                  <div key={edital.id} className="relative group">
                    <button
                      onClick={() => navigateTo(`edital-${edital.id}`)}
                      className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 border pr-10 ${currentView === `edital-${edital.id}` ? "bg-blue-900 text-white shadow-md border-transparent" : "text-slate-500 hover:bg-slate-100 border-transparent"}`}
                    >
                        <BookOpen className="w-5 h-5 shrink-0" />
                        <span className="truncate flex-1">{edital.titulo}</span>
                    </button>
                    {setPinnedEditalId && (
                      <button 
                        onClick={() => setPinnedEditalId(pinnedEditalId === edital.id ? null : edital.id)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${pinnedEditalId === edital.id ? 'opacity-100 text-amber-500' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-amber-500 hover:bg-slate-100'}`}
                        title={pinnedEditalId === edital.id ? "Desafixar Edital" : "Fixar Edital como Padrão"}
                      >
                        <Pin className={`w-4 h-4 ${pinnedEditalId === edital.id ? 'fill-current' : ''}`}/>
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
            
            <div className="mt-auto pt-6">
              <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-100 transition-colors border border-transparent">
                <LogOut className="w-5 h-5" />
                <span>Sair da conta</span>
              </button>
            </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden h-full pt-16 md:pt-0">
         {currentView === "dashboard" && <Dashboard />}
         {currentView === "revisao" && <RevisaoSugestoes />}
         {currentView === "ciclos" && <StudyCycles />}
         {currentView === "shared" && <SharedHub />}
         {currentView === "cartoes" && <CartoesView />}
         {currentView === "cartoes_erros" && <CartoesErrosView />}
         {currentView === "discursivas" && <DiscursivasView />}
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

function LoginScreen() {
  const { loginWithGoogle, authError } = useAuth();
  
  return (
    <div className="flex items-center justify-center h-screen bg-slate-50 font-sans p-4">
      <div className="bg-white border border-slate-200 p-10 rounded-3xl max-w-sm w-full text-center shadow-2xl flex flex-col items-center relative">
        <div className="w-12 h-12 bg-blue-900 rounded-xl shadow-lg shadow-blue-900/20 mb-6 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-slate-900" />
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">VER.AI</h1>
        <p className="text-sm text-slate-400 font-medium mb-8">Planeje e acompanhe seus estudos com IA.</p>
        
        {authError && (
          <div className="w-full bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-xl mb-6 text-left">
             <span className="font-bold block mb-1">Erro de Login:</span>
             <p>{authError}</p>
             <p className="mt-2 text-[10px] text-rose-500/80">
               Pode ocorrer se você estiver usando um navegador embutido (ex: Instagram, WhatsApp) ou se a "Prevenção de Rastreamento" estiver ativada no seu navegador móvel. Tente abrir o link diretamente no Safari ou Chrome.
             </p>
          </div>
        )}

        <button 
          onClick={loginWithGoogle}
          className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold py-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" fillRule="evenodd" d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
          </svg>
          Entrar com Google
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <LoginScreen />;
  }
  
  return (
    <EditalProvider>
      <AppContent />
    </EditalProvider>
  );
}

