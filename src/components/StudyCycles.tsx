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
  Target,
  Edit2,
  Check,
  X,
  PlusCircle,
  FileSpreadsheet,
  Cloud
} from "lucide-react";
import * as XLSX from "xlsx";
import { generateStudyCycleAI } from "../services/ai";

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

export function StudyCycles() {
  const { editais, ciclos, addCiclo, deleteCiclo, updateCiclo, toggleCicloItem } = useEdital();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedEditalId, setSelectedEditalId] = useState<string>("");
  const [showNewCycleModal, setShowNewCycleModal] = useState(false);
  
  // IA Suggestion Params
  const [totalCycleHours, setTotalCycleHours] = useState<number>(20);
  const [maxSubjectsCount, setMaxSubjectsCount] = useState<number>(0);
  const [subjectsParams, setSubjectsParams] = useState<{nome: string, questoes: number, peso: number}[]>([]);

  // Editing states
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDuration, setEditDuration] = useState<number>(0);
  
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);

  const handleEditalSelect = (editalId: string) => {
    setSelectedEditalId(editalId);
    if (!editalId) {
      setSubjectsParams([]);
      return;
    }
    const edital = editais.find(e => e.id === editalId);
    if (edital) {
      const allMaterias = edital.areas.flatMap(a => a.materias.map(m => m.nome));
      setSubjectsParams(allMaterias.map(m => ({ nome: m, questoes: 10, peso: 1 })));
    }
  };

  const handleUpdateSubjectParam = (index: number, field: 'questoes' | 'peso', value: number) => {
    const newParams = [...subjectsParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setSubjectsParams(newParams);
  };

  const handleGenerateAI = async () => {
    if (!selectedEditalId) return;
    const edital = editais.find(e => e.id === selectedEditalId);
    if (!edital) return;

    setIsGenerating(true);
    try {
      const allMaterias = edital.areas.flatMap(a => a.materias.map(m => m.nome));
      const result = await generateStudyCycleAI(edital.titulo, allMaterias, {
        totalHoursPerCycle: totalCycleHours,
        subjectsInfo: subjectsParams,
        maxSubjectsPerCycle: maxSubjectsCount
      });
      
      const newItems: StudyCycleItem[] = result.map((item: any) => ({
        id: uuidv4(),
        materiaId: uuidv4(),
        materiaNome: item.materiaNome,
        duracao: item.duracao,
        concluido: false
      }));

      const newCycle: StudyCycle = {
        id: uuidv4(),
        editalId: edital.id,
        nome: `Ciclo IA - ${edital.titulo}`,
        items: newItems,
        created_at: new Date().toISOString(),
        targetMinutes: totalCycleHours * 60
      };

      addCiclo(newCycle);
      setShowNewCycleModal(false);
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao gerar ciclo com IA: ${error.message || JSON.stringify(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddManualCycle = () => {
    const newCycle: StudyCycle = {
      id: uuidv4(),
      editalId: "",
      nome: `Novo Ciclo ${ciclos.length + 1}`,
      items: [],
      created_at: new Date().toISOString()
    };
    addCiclo(newCycle);
    setEditingCycleId(newCycle.id);
    setEditValue(newCycle.nome);
    setShowNewCycleModal(false);
  };

  const handleAddSubject = (cicloId: string) => {
    const ciclo = ciclos.find(c => c.id === cicloId);
    if (!ciclo) return;

    const newItem: StudyCycleItem = {
      id: uuidv4(),
      materiaId: uuidv4(),
      materiaNome: "Nova Matéria",
      duracao: 60,
      concluido: false
    };

    const updatedCiclo = {
      ...ciclo,
      items: [...ciclo.items, newItem]
    };
    updateCiclo(updatedCiclo);
    setEditingItemId(newItem.id);
    setEditValue(newItem.materiaNome);
    setEditDuration(newItem.duracao);
  };

  const handleRemoveSubject = (cicloId: string, itemId: string) => {
    const ciclo = ciclos.find(c => c.id === cicloId);
    if (!ciclo) return;

    const updatedCiclo = {
      ...ciclo,
      items: ciclo.items.filter(i => i.id !== itemId)
    };
    updateCiclo(updatedCiclo);
  };

  const saveCycleTitle = (cicloId: string) => {
    const ciclo = ciclos.find(c => c.id === cicloId);
    if (ciclo && editValue.trim()) {
      updateCiclo({ ...ciclo, nome: editValue.trim() });
    }
    setEditingCycleId(null);
  };

  const saveSubjectEdit = (cicloId: string, itemId: string) => {
    const ciclo = ciclos.find(c => c.id === cicloId);
    if (ciclo) {
      const newItems = ciclo.items.map(item => {
        if (item.id === itemId) {
          return { ...item, materiaNome: editValue.trim() || item.materiaNome, duracao: editDuration };
        }
        return item;
      });
      updateCiclo({ ...ciclo, items: newItems });
    }
    setEditingItemId(null);
  };

  const downloadExcel = (ciclo: StudyCycle) => {
    const data = ciclo.items.map((item, index) => ({
      "Ordem": index + 1,
      "Matéria": item.materiaNome,
      "Duração (min)": item.duracao,
      "Concluido": item.concluido ? "SIM" : "NÃO"
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ciclo");
    XLSX.writeFile(wb, `${ciclo.nome.replace(/\//g, '-')}.xlsx`);
  };

  const downloadAllCycles = () => {
    if (ciclos.length === 0) return;
    const wb = XLSX.utils.book_new();
    
    ciclos.forEach(ciclo => {
      const data = ciclo.items.map((item, index) => ({
        "Ordem": index + 1,
        "Matéria": item.materiaNome,
        "Duração (min)": item.duracao,
        "Concluido": item.concluido ? "SIM" : "NÃO"
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, (ciclo.nome.substring(0, 31)).replace(/[\\\/\?\*\[\]]/g, '')); // excel sheet limit 31 chars
    });

    XLSX.writeFile(wb, `Todos_os_Ciclos_${new Date().toLocaleDateString()}.xlsx`);
  };

  const saveToGoogleDrive = async () => {
    if (ciclos.length === 0) return;
    
    setIsUploadingDrive(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.setCustomParameters({
        prompt: 'consent'
      });
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential || !credential.accessToken) {
        throw new Error("Não foi possível obter a permissão do Google Drive.");
      }
      
      const token = credential.accessToken;
      
      const wb = XLSX.utils.book_new();
      
      ciclos.forEach(ciclo => {
        const data = ciclo.items.map((item, index) => ({
          "Ordem": index + 1,
          "Matéria": item.materiaNome,
          "Duração (min)": item.duracao,
          "Concluido": item.concluido ? "SIM" : "NÃO"
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, (ciclo.nome.substring(0, 31)).replace(/[\\\/\?\*\[\]]/g, ''));
      });
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const metadata = {
        name: `Sincronizacao_Ciclos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
      
      // 1. Create file metadata
      const metaResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });
      
      if (!metaResponse.ok) {
        let errMessage = 'Erro desconhecido';
        try {
          const errData = await metaResponse.json();
          errMessage = errData.error?.message || JSON.stringify(errData);
        } catch(e) { /* ignore */ }
        throw new Error(`Falha ao criar arquivo no Drive: ${errMessage}`);
      }
      
      const fileData = await metaResponse.json();
      
      // 2. Upload file content
      const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileData.id}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        body: blob
      });
      
      if (!uploadResponse.ok) {
        let errMessage = 'Erro desconhecido';
        try {
          const errData = await uploadResponse.json();
          errMessage = errData.error?.message || JSON.stringify(errData);
        } catch(e) { /* ignore */ }
        throw new Error(`Falha ao fazer upload do conteúdo: ${errMessage}`);
      }
      
      alert("Planilha salva com sucesso no seu Google Drive!");
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao salvar no Drive: ${err.message}`);
    } finally {
      setIsUploadingDrive(false);
    }
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
        <div className="flex flex-wrap items-center gap-2">
          {ciclos.length > 0 && (
            <>
              <button 
                onClick={downloadAllCycles}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all font-bold text-sm shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Baixar Todos
              </button>
              <button 
                onClick={saveToGoogleDrive}
                disabled={isUploadingDrive}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all font-bold text-sm shadow-sm disabled:opacity-50"
              >
                {isUploadingDrive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                {isUploadingDrive ? "Salvando..." : "Google Drive"}
              </button>
            </>
          )}
          <button 
            onClick={() => setShowNewCycleModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Ciclo
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {ciclos.map((ciclo) => {
            const completed = ciclo.items.filter(i => i.concluido).length;
            const progress = ciclo.items.length > 0 ? (completed / ciclo.items.length) * 100 : 0;
            const totalMinutes = ciclo.items.reduce((acc, i) => acc + i.duracao, 0);
            const targetMinutes = ciclo.targetMinutes;
            const timeDiff = targetMinutes ? targetMinutes - totalMinutes : 0;
            
            return (
              <motion.div 
                key={ciclo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group/card"
              >
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    {editingCycleId === ciclo.id ? (
                      <input 
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveCycleTitle(ciclo.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveCycleTitle(ciclo.id)}
                        className="font-bold text-slate-900 bg-white border border-indigo-200 rounded px-2 py-1 flex-1 outline-none"
                      />
                    ) : (
                      <h2 
                        onDoubleClick={() => { setEditingCycleId(ciclo.id); setEditValue(ciclo.nome); }}
                        className="font-bold text-slate-900 line-clamp-1 cursor-text flex-1"
                      >
                        {ciclo.nome}
                      </h2>
                    )}
                    <div className="flex items-center">
                      <button 
                        onClick={() => { setEditingCycleId(ciclo.id); setEditValue(ciclo.nome); }}
                        className="text-slate-400 hover:text-indigo-600 p-1 opacity-0 group-hover/card:opacity-100 transition-opacity"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => confirm("Remover ciclo?") && deleteCiclo(ciclo.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mb-2">
                    <div className="flex items-center gap-1">
                      <History className="w-3 h-3" />
                      {new Date(ciclo.created_at).toLocaleDateString()}
                    </div>
                    {targetMinutes ? (
                      <div className="flex items-center gap-1 pl-2 border-l border-slate-200" title={`Objetivo: ${Math.floor(targetMinutes/60)}h${targetMinutes%60 ? ` ${targetMinutes%60}m` : ''}`}>
                        <Target className="w-3 h-3 text-indigo-500" />
                        <span className="font-bold text-slate-700">{Math.floor(totalMinutes/60)}h {totalMinutes%60}m acumulado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                        <Clock className="w-3 h-3" />
                        <span>{Math.floor(totalMinutes/60)}h {totalMinutes%60}m</span>
                      </div>
                    )}
                  </div>
                  
                  {targetMinutes && timeDiff !== 0 && (
                    <div className={`text-[10px] font-bold px-2 py-1 rounded inline-flex mb-3 ${timeDiff > 0 ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-rose-100 text-rose-800 border border-rose-200"}`}>
                      {timeDiff > 0 ? (
                        <span>Faltam {timeDiff} min para atingir o objetivo de {targetMinutes / 60}h. Ajuste os tempos ou adicione matéria.</span>
                      ) : (
                        <span>Excedeu em {Math.abs(timeDiff)} min o objetivo de {targetMinutes / 60}h.</span>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">
                      <span>Progresso do Ciclo</span>
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

                <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[350px] scrollbar-thin">
                  {ciclo.items.map((item, idx) => (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all group/item ${
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
                        {editingItemId === item.id ? (
                          <div className="flex flex-col gap-1">
                            <input 
                              autoFocus
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="text-xs font-bold bg-white border border-indigo-200 rounded px-1.5 py-0.5 outline-none"
                            />
                            <div className="flex items-center gap-2">
                              <input 
                                type="number"
                                value={editDuration}
                                onChange={e => setEditDuration(parseInt(e.target.value)||0)}
                                className="text-[10px] w-12 bg-white border border-indigo-200 rounded px-1.5 py-0.5 outline-none"
                              />
                              <span className="text-[10px] text-slate-400">min</span>
                              <button onClick={() => saveSubjectEdit(ciclo.id, item.id)} className="p-1 bg-indigo-600 text-white rounded"><Check className="w-3 h-3" /></button>
                              <button onClick={() => setEditingItemId(null)} className="p-1 bg-slate-200 text-slate-600 rounded"><X className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p 
                              onDoubleClick={() => { setEditingItemId(item.id); setEditValue(item.materiaNome); setEditDuration(item.duracao); }}
                              className={`text-sm font-medium truncate cursor-text ${item.concluido ? 'line-through opacity-60' : ''}`}
                            >
                              {item.materiaNome}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <Clock className="w-3 h-3" />
                              {item.duracao} min
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                         <button 
                           onClick={() => { setEditingItemId(item.id); setEditValue(item.materiaNome); setEditDuration(item.duracao); }}
                           className="p-1 text-slate-400 hover:text-indigo-600"
                         >
                           <Edit2 className="w-3 h-3" />
                         </button>
                         <button 
                           onClick={() => handleRemoveSubject(ciclo.id, item.id)}
                           className="p-1 text-slate-400 hover:text-rose-500"
                         >
                           <Trash2 className="w-3 h-3" />
                         </button>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => handleAddSubject(ciclo.id)}
                    className="w-full py-2 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 text-xs font-medium"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Adicionar Matéria
                  </button>

                  {/* Summary of subjects */}
                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Resumo por Matéria</h3>
                    <div className="space-y-1.5">
                      {Object.entries(
                        ciclo.items.reduce((acc, i) => {
                          acc[i.materiaNome] = (acc[i.materiaNome] || 0) + i.duracao;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, mins]) => (
                        <div key={name} className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 truncate mr-2" title={name}>{name}</span>
                          <span className="font-mono font-medium text-slate-700 whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded">
                            {Math.floor(mins / 60)}h {mins % 60}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={() => downloadExcel(ciclo)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-slate-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    BAIXAR PLANILHA
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
                  <p className="text-sm text-slate-500">Escolha como deseja criar seu ciclo de estudos.</p>
                </div>
                <button 
                   onClick={() => setShowNewCycleModal(false)}
                   className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <button 
                  onClick={handleAddManualCycle}
                  className="w-full flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50/30 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Criar Manualmente</h4>
                    <p className="text-xs text-slate-500">Adicione as matérias e tempos você mesmo.</p>
                  </div>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400"><span className="bg-white px-2">OU</span></div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Gerar com IA (Escolha o Edital)</label>
                  <select 
                    value={selectedEditalId}
                    onChange={(e) => handleEditalSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all mb-4"
                  >
                    <option value="">Selecione um edital...</option>
                    {editais.map(e => (
                      <option key={e.id} value={e.id}>{e.titulo}</option>
                    ))}
                  </select>

                  {selectedEditalId && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 mb-6"
                    >
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex flex-col gap-4 mb-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Horas por Ciclo
                            </label>
                            <input 
                              type="number"
                              value={totalCycleHours}
                              onChange={(e) => setTotalCycleHours(parseInt(e.target.value) || 0)}
                              className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              Limite de Matérias (0 = Todas)
                            </label>
                            <input 
                              type="number"
                              value={maxSubjectsCount}
                              onChange={(e) => setMaxSubjectsCount(parseInt(e.target.value) || 0)}
                              className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500/20"
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Peso e Questões por Matéria</div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                          {subjectsParams.map((param, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
                              <span className="flex-1 text-[11px] font-medium text-slate-700 truncate">{param.nome}</span>
                              <div className="flex gap-1 items-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-[8px] text-slate-400 font-bold">QUESTÕES</span>
                                  <input 
                                    type="number"
                                    value={param.questoes}
                                    onChange={(e) => handleUpdateSubjectParam(idx, 'questoes', parseInt(e.target.value) || 0)}
                                    className="w-12 text-[10px] border border-slate-100 rounded p-1 text-center font-bold"
                                  />
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-[8px] text-slate-400 font-bold">PESO</span>
                                  <input 
                                    type="number"
                                    value={param.peso}
                                    onChange={(e) => handleUpdateSubjectParam(idx, 'peso', parseInt(e.target.value) || 0)}
                                    className="w-10 text-[10px] border border-slate-100 rounded p-1 text-center font-bold"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-indigo-900 mb-1">Cálculo Inteligente por IA</h4>
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        A IA usará o peso e número de questões para calcular a importância de cada matéria e distribuir as horas proporcionalmente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button 
                  disabled={!selectedEditalId || isGenerating}
                  onClick={handleGenerateAI}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
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
