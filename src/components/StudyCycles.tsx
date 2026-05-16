import { useState } from "react";
import { useEdital } from "../store";
import { StudyCycle, StudyCycleItem, Edital } from "../types";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Download, 
  Sparkles, 
  Clock, 
  Loader2,
  ChevronRight,
  BookOpen,
  History,
  Target
} from "lucide-react";
import * as XLSX from "xlsx";
import { generateStudyCycleAI } from "../services/ai";

export function StudyCycles() {
  const { editais, ciclos, addCiclo, deleteCiclo, toggleCicloItem } = useEdital();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedEditalId, setSelectedEditalId] = useState<string>("");
  const [showNewCycleModal, setShowNewCycleModal] = useState(false);

  const handleGenerateAI = async () => {
    if (!selectedEditalId) return;
    const edital = editais.find(e => e.id === selectedEditalId);
    if (!edital) return;

    setIsGenerating(true);
    try {
      const allMaterias = edital.areas.flatMap(a => a.materias.map(m => m.nome));
      const result = await generateStudyCycleAI(edital.titulo, allMaterias);
      
      const newItems: StudyCycleItem[] = result.map((item: any) => ({
        id: uuidv4(),
        materiaId: uuidv4(), // We don't necessarily need the real ID here as long as we have the name
        materiaNome: item.materiaNome,
        duracao: item.duracao,
        concluido: false
      }));

      const newCycle: StudyCycle = {
        id: uuidv4(),
        editalId: edital.id,
        nome: `Ciclo ${ciclos.length + 1} - ${edital.titulo}`,
        items: newItems,
        created_at: new Date().toISOString()
      };

      addCiclo(newCycle);
      setShowNewCycleModal(false);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar ciclo com IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadExcel = (ciclo: StudyCycle) => {
    const data = ciclo.items.map((item, index) => ({
      "Ordem": index + 1,
      "Matéria": item.materiaNome,
      "Duração (min)": item.duracao,
      "Concluído": item.concluido ? "SIM" : "NÃO"
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ciclo");
    XLSX.writeFile(wb, `${ciclo.nome}.xlsx`);
  };

  return (
    <div className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-50">
      <header className="max-w-5xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-8 h-8 text-indigo-600" />
            Ciclos de Estudos
          </h1>
          <p className="text-slate-500 text-sm">Organize sua rotina de estudos de forma dinâmica e eficiente.</p>
        </div>
        <button 
          onClick={() => setShowNewCycleModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Ciclo
        </button>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {ciclos.map((ciclo) => {
            const completed = ciclo.items.filter(i => i.concluido).length;
            const progress = (completed / ciclo.items.length) * 100;
            
            return (
              <motion.div 
                key={ciclo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="font-bold text-slate-900 line-clamp-1">{ciclo.nome}</h2>
                    <button 
                      onClick={() => confirm("Remover ciclo?") && deleteCiclo(ciclo.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                    <History className="w-3 h-3" />
                    {new Date(ciclo.created_at).toLocaleDateString()}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-indigo-600">
                      <span>PROGRESSO</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[300px]">
                  {ciclo.items.map((item, idx) => (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        item.concluido 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
                          : 'bg-white border-slate-100 hover:border-indigo-100'
                      }`}
                    >
                      <button 
                        onClick={() => toggleCicloItem(ciclo.id, item.id)}
                        className={`shrink-0 transition-transform active:scale-90 ${
                          item.concluido ? 'text-emerald-500' : 'text-slate-300'
                        }`}
                      >
                        {item.concluido ? <CheckCircle2 className="w-5 h-5 fill-emerald-50" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${item.concluido ? 'line-through opacity-60' : ''}`}>
                          {item.materiaNome}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          {item.duracao} min
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-300">
                        #{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={() => downloadExcel(ciclo)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-slate-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PLANILHA
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {ciclos.length === 0 && !showNewCycleModal && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10" />
            </div>
            <p className="font-medium text-slate-500">Nenhum ciclo criado ainda.</p>
            <p className="text-sm">Clique em "Novo Ciclo" para começar.</p>
          </div>
        )}
      </div>

      {/* New Cycle Modal */}
      <AnimatePresence>
        {showNewCycleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewCycleModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Gerar Novo Ciclo</h3>
                  <p className="text-sm text-slate-500">Escolha um edital para a IA organizar seus estudos.</p>
                </div>
                <button 
                   onClick={() => setShowNewCycleModal(false)}
                   className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Selecione o Edital</label>
                  <select 
                    value={selectedEditalId}
                    onChange={(e) => setSelectedEditalId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                  >
                    <option value="">Selecione um edital...</option>
                    {editais.map(e => (
                      <option key={e.id} value={e.id}>{e.titulo}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 mb-1">Ciclo Inteligente por IA</h4>
                    <p className="text-xs text-indigo-700 leading-relaxed">
                      Nossa inteligência artificial analisará todas as matérias e tópicos para criar uma sequência lógica, alternando conteúdos e definindo durações ideais para seu foco.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button 
                  disabled={!selectedEditalId || isGenerating}
                  onClick={handleGenerateAI}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Organizando seu tempo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Gerar Ciclo com IA
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
