import React, { useState } from "react";
import { useEdital } from "../store";
import { format, isPast, isToday } from "date-fns";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Edital, Cartao } from "../types";
import { 
  ChevronDown, ChevronUp, GripVertical, ArrowUp, ArrowDown, 
  ChevronRight, 
  Plus, 
  Edit2, 
  Trash2, 
  CalendarIcon, 
  StickyNote, 
  X, 
  History, 
  CheckCircle2, 
  Check,
  ListTodo, 
  FileText, 
  BookOpen, 
  CornerDownRight,
  Download,
  Loader2,
  Sparkles,
  Share2,
  Hash
} from "lucide-react";

import { parseEditalText, generateStudyNotes, generateFlashcards } from "../services/ai";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export function EditalView({ edital }: { edital: Edital, key?: string | number }) {
  const { 
    deleteEdital, 
    toggleVisto, 
    updateItemTitle, 
    deleteItem, 
    addItem, 
    addMaterias,
    setNextRevisionDate, 
    addCustomRevisionDate, 
    removeRevisionDate, 
    setStudyDate, 
    updateNota, 
    updateCartoes,
    updateMetricas, 
    revisions,
    setEditalPublic,
    ciclos,
    reorderMaterias,
    reorderTopicos,
    reorderSubtopicos
  } = useEdital();
  
  const editalCiclos = ciclos.filter(c => c.editalId === edital.id);
  const [shareModal, setShareModal] = useState<{ isOpen: boolean, selectedCiclos: string[] } | null>(null);

  const safeConfirm = (msg: string) => {
    try {
      if (window.self !== window.top) return true;
      return window.confirm(msg);
    } catch (e) { return true; }
  };

  const [expandedMaterias, setExpandedMaterias] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState<'topicos' | 'revisoes' | 'notas' | 'cartoes'>('topicos');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [notesModal, setNotesModal] = useState<{ isOpen: boolean, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string, currentNote: string, title: string } | null>(null);
  const [cartoesModal, setCartoesModal] = useState<{ isOpen: boolean, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string, cartoes: Cartao[], title: string } | null>(null);
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string } | null>(null);
  const [aiModal, setAiModal] = useState<{isOpen: boolean, editalId: string, areaId: string} | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [notesAiLoading, setNotesAiLoading] = useState(false);
  const [cartoesAiLoading, setCartoesAiLoading] = useState(false);
  const [cartoesBaseText, setCartoesBaseText] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const handleGenerateNotes = async () => {
    if (!notesModal) return;
    setNotesAiLoading(true);
    try {
       const area = edital.areas.find(a => a.id === notesModal.areaId);
       const materia = area?.materias.find(m => m.id === notesModal.materiaId);
       const topico = materia?.topicos.find(t => t.id === notesModal.topicoId);
       const subtopico = notesModal.subtopicoId ? topico?.subtopicos.find(s => s.id === notesModal.subtopicoId) : undefined;
       
       if (materia && topico) {
         const generated = await generateStudyNotes(materia.nome, topico.titulo, subtopico?.titulo);
         setNotesModal(prev => prev ? { ...prev, currentNote: prev.currentNote ? prev.currentNote + "\n\n" + generated : generated } : null);
       }
    } catch (err) {
       console.error(err);
       alert("Erro ao gerar resumo com IA. Tente novamente.");
    } finally {
       setNotesAiLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!cartoesModal) return;
    setCartoesAiLoading(true);
    try {
       const area = edital.areas.find(a => a.id === cartoesModal.areaId);
       const materia = area?.materias.find(m => m.id === cartoesModal.materiaId);
       const topico = materia?.topicos.find(t => t.id === cartoesModal.topicoId);
       const subtopico = cartoesModal.subtopicoId ? topico?.subtopicos.find(s => s.id === cartoesModal.subtopicoId) : undefined;
       
       if (materia && topico) {
         const generated = await generateFlashcards(materia.nome, topico.titulo, subtopico?.titulo, cartoesBaseText);
         const novosCartoes = generated.map(g => ({ id: Math.random().toString(36).substring(7), pergunta: g.pergunta, resposta: g.resposta }));
         setCartoesModal(prev => prev ? { ...prev, cartoes: [...(prev.cartoes || []), ...novosCartoes] } : null);
         setCartoesBaseText("");
       }
    } catch (err) {
       console.error(err);
       alert("Erro ao gerar cartões com IA. Tente novamente.");
    } finally {
       setCartoesAiLoading(false);
    }
  };

  const handleShareClick = () => {
     setShareModal({ isOpen: true, selectedCiclos: editalCiclos.map(c => c.id) });
  };

  const handleShareSubmit = async (type: 'link' | 'code' = 'link') => {
    if (isSharing || !shareModal) return;
    setIsSharing(true);
    try {
       // Always set edital public and correctly set specified cycles public
       await setEditalPublic(edital.id, true, shareModal.selectedCiclos);
       
       if (type === 'link') {
         let url = `${window.location.origin}/?import=${edital.id}`;
         if (shareModal.selectedCiclos.length > 0) {
           url += `&ciclos=${shareModal.selectedCiclos.join(",")}`;
         }
         await navigator.clipboard.writeText(url);
         alert("Link copiado! Compartilhe o link para importar este edital" + (shareModal.selectedCiclos.length > 0 ? " e seus ciclos." : "."));
       } else {
         let code = `EDT-${edital.id}`;
         if (shareModal.selectedCiclos.length > 0) {
           code += `;;${shareModal.selectedCiclos.join(",")}`;
         }
         await navigator.clipboard.writeText(code);
         alert("Código de exportação copiado: " + code);
       }
       setShareModal(null);
    } catch (e) {
       console.error("Erro ao gerar link:", e);
       alert("Erro ao compartilhar.");
    } finally {
       setIsSharing(false);
    }
  };

  const handleEdit = (id: string, currentTitle: string) => {
    setEditingItemId(id);
    setEditValue(currentTitle);
  };

  const saveEdit = (areaId: string, materiaId: string, topicoId: string, type: 'edital' | 'area' | 'materia' | 'topico' | 'subtopico', customId?: string) => {
    if (editingItemId && editValue.trim()) {
      const targetId = customId || (type === 'subtopico' ? customId : topicoId || editingItemId);
      updateItemTitle(edital.id, areaId, materiaId, targetId as string, editValue, type);
    }
    setEditingItemId(null);
  };

  const toggleMateria = (id: string) => setExpandedMaterias(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const getNextRevision = (dates: string[]) => {
    if (!dates || dates.length === 0) return null;
    const sorted = dates.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
    return sorted.length > 0 ? sorted[0] : null;
  };

  const stats = (() => {
    let total = 0;
    let completed = 0;
    edital.areas.forEach(a => {
      a.materias.forEach(m => {
        m.topicos.forEach(t => {
          total++;
          if (t.visto) completed++;
          t.subtopicos.forEach(s => {
            total++;
            if (s.visto) completed++;
          });
        });
      });
    });
    return { total, completed, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
  })();

  const allCartoes: any[] = [];
  edital.areas.forEach(a => {
    a.materias.forEach(m => {
      m.topicos.forEach(t => {
        if (t.cartoes && t.cartoes.length > 0) {
          t.cartoes.forEach(c => allCartoes.push({ area: a.area, materia: m.nome, topico: t.titulo, cartao: c, areaId: a.id, materiaId: m.id, topicoId: t.id }));
        }
        t.subtopicos.forEach(s => {
          if (s.cartoes && s.cartoes.length > 0) {
            s.cartoes.forEach(c => allCartoes.push({ area: a.area, materia: m.nome, topico: t.titulo, subtopico: s.titulo, cartao: c, areaId: a.id, materiaId: m.id, topicoId: t.id, subtopicoId: s.id }));
          }
        });
      });
    });
  });

  const allNotes: any[] = [];
  edital.areas.forEach(a => {
    a.materias.forEach(m => {
      m.topicos.forEach(t => {
        if (t.notas) allNotes.push({ area: a.area, materia: m.nome, topico: t.titulo, notas: t.notas, areaId: a.id, materiaId: m.id, topicoId: t.id });
        t.subtopicos.forEach(s => {
          if (s.notas) allNotes.push({ area: a.area, materia: m.nome, topico: t.titulo, subtopico: s.titulo, notas: s.notas, areaId: a.id, materiaId: m.id, topicoId: t.id, subtopicoId: s.id });
        });
      });
    });
  });

  const editalRevisions = revisions.filter(r => r.editalId === edital.id);
  
  let historyItemInfo: any = null;
  if(historyModal?.isOpen) {
    const area = edital.areas.find(a => a.id === historyModal.areaId);
    const materia = area?.materias.find(m => m.id === historyModal.materiaId);
    const topico = materia?.topicos.find(t => t.id === historyModal.topicoId);
    if(topico) {
      if(historyModal.subtopicoId) {
        historyItemInfo = topico.subtopicos.find(s => s.id === historyModal.subtopicoId);
      } else {
        historyItemInfo = topico;
      }
    }
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    const parts = destination.droppableId.split('|');
    const itemType = parts[0];
    
    if (itemType === 'materia') {
      reorderMaterias(edital.id, parts[1], source.index, destination.index);
    } else if (itemType === 'topico') {
      reorderTopicos(edital.id, parts[1], parts[2], source.index, destination.index);
    } else if (itemType === 'subtopico') {
      reorderSubtopicos(edital.id, parts[1], parts[2], parts[3], source.index, destination.index);
    }
  };

  const downloadExcel = () => {
    const rows: any[] = [];
    
    edital.areas.forEach(area => {
      area.materias.forEach(materia => {
        materia.topicos.forEach(topico => {
          if (topico.subtopicos.length === 0) {
             rows.push({
               "Área": area.area,
               "Matéria": materia.nome,
               "Tópico": topico.titulo,
               "Subtópico": "-",
               "Concluído": topico.visto ? true : false,
               "Data Estudo": topico.data_estudo ? format(new Date(topico.data_estudo), "dd/MM/yyyy") : "",
               "Acertos": topico.acertos || 0,
               "Erros": topico.erros || 0,
               "Aproveitamento": topico.acertos || topico.erros ? Math.round((topico.acertos / (topico.acertos + topico.erros)) * 100) + '%' : "0%",
               "Rev 1": topico.revisoes_agendadas[0] ? format(new Date(topico.revisoes_agendadas[0]), "dd/MM/yyyy") : "",
               "Rev 2": topico.revisoes_agendadas[1] ? format(new Date(topico.revisoes_agendadas[1]), "dd/MM/yyyy") : "",
               "Rev 3": topico.revisoes_agendadas[2] ? format(new Date(topico.revisoes_agendadas[2]), "dd/MM/yyyy") : "",
               "Rev 4": topico.revisoes_agendadas[3] ? format(new Date(topico.revisoes_agendadas[3]), "dd/MM/yyyy") : "",
               "Notas": topico.notas || ""
             });
          } else {
             topico.subtopicos.forEach(sub => {
                rows.push({
                   "Área": area.area,
                   "Matéria": materia.nome,
                   "Tópico": topico.titulo,
                   "Subtópico": sub.titulo,
                   "Concluído": sub.visto ? true : false,
                   "Data Estudo": sub.data_estudo ? format(new Date(sub.data_estudo), "dd/MM/yyyy") : "",
                   "Acertos": sub.acertos || 0,
                   "Erros": sub.erros || 0,
                   "Aproveitamento": sub.acertos || sub.erros ? Math.round((sub.acertos / (sub.acertos + sub.erros)) * 100) + '%' : "0%",
                   "Rev 1": sub.revisoes_agendadas[0] ? format(new Date(sub.revisoes_agendadas[0]), "dd/MM/yyyy") : "",
                   "Rev 2": sub.revisoes_agendadas[1] ? format(new Date(sub.revisoes_agendadas[1]), "dd/MM/yyyy") : "",
                   "Rev 3": sub.revisoes_agendadas[2] ? format(new Date(sub.revisoes_agendadas[2]), "dd/MM/yyyy") : "",
                   "Rev 4": sub.revisoes_agendadas[3] ? format(new Date(sub.revisoes_agendadas[3]), "dd/MM/yyyy") : "",
                   "Notas": sub.notas || ""
                });
             });
          }
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Edital");
    
    const maxWidths = rows.reduce((acc, row) => {
        Object.keys(row).forEach(key => {
            const val = String(row[key]);
            acc[key] = Math.max(acc[key] || key.length, val.length);
        });
        return acc;
    }, {} as Record<string, number>);
    
    worksheet['!cols'] = Object.keys(rows[0] || {}).map(key => ({
        wch: Math.min((maxWidths as any)[key] + 2, 50)
    }));

    XLSX.writeFile(workbook, `Edital_${edital.titulo.substring(0,20).replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.text(`Edital: ${edital.titulo}`, 14, 20);

    const tableData: any[] = [];
    edital.areas.forEach(area => {
      tableData.push([{ content: `ÁREA: ${area.area}`, colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
      area.materias.forEach(materia => {
        tableData.push([{ content: `MATÉRIA: ${materia.nome}`, colSpan: 2, styles: { fillColor: [245, 245, 245], fontStyle: 'bold', textColor: [50, 50, 50] } }]);
        materia.topicos.forEach(topico => {
           let status = topico.visto ? "Concluído" : "Pendente";
           tableData.push([topico.titulo, status]);
           topico.subtopicos.forEach(sub => {
              let subStatus = sub.visto ? "Concluído" : "Pendente";
              tableData.push([`  - ${sub.titulo}`, subStatus]);
           });
        });
      });
    });

    autoTable(doc, {
      startY: 28,
      head: [['Conteúdo Programático', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 10 }
    });

    doc.save(`edital_${edital.titulo.replace(/\\s+/g, '_').toLowerCase()}.pdf`);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex-1 flex flex-col h-full bg-slate-50 selection:bg-blue-900/30 font-sans text-slate-800">
        {/* Header */}
      <header className="min-h-[3.5rem] px-3 sm:px-6 py-2 sm:py-0 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 border-b border-slate-200 bg-slate-50/50 backdrop-blur-xl sticky top-0 z-30 gap-2 sm:gap-0">
        <div className="flex flex-col w-full sm:w-auto">
          <h2 className="text-base sm:text-lg font-display font-semibold text-slate-900 leading-tight flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-800 shrink-0" />
            {editingItemId === edital.id ? (
              <input
                 autoFocus
                 value={editValue}
                 onChange={(e) => setEditValue(e.target.value)}
                 onBlur={() => saveEdit('', '', '', 'edital', edital.id)}
                 onKeyDown={(e) => e.key === 'Enter' && saveEdit('', '', '', 'edital', edital.id)}
                 className="bg-transparent text-slate-900 outline-none border-b border-blue-800 w-full"
              />
            ) : (
              <span onDoubleClick={() => handleEdit(edital.id, edital.titulo)} className="cursor-text break-words line-clamp-2">{edital.titulo}</span>
            )}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-blue-800 font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] bg-blue-900/10 px-1.5 py-[1px] rounded border border-blue-900/20">Edital Ativo</span>
            {edital.importedFrom && (
              <span className="text-[9px] text-purple-700 font-bold uppercase tracking-wider bg-purple-100 px-1.5 py-[1px] rounded border border-purple-200" title={`Importado de: ${edital.importedFrom}`}>
                Importado: {edital.importedFrom.split(' ')[0]}
              </span>
            )}
            <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider sm:tracking-widest">{stats.completed} de {stats.total} concluídos</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-auto w-full sm:w-auto justify-end mt-2 sm:mt-0 flex-wrap">
           <button disabled={isSharing} onClick={handleShareClick} className="flex-1 sm:flex-none justify-center group flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition-all shadow-sm disabled:opacity-50">
             {isSharing ? <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" /> : <Share2 className="w-3.5 h-3.5 shrink-0" />}
             <span className="hidden sm:inline">Compartilhar</span>
           </button>
           <button onClick={downloadExcel} className="flex-1 sm:flex-none justify-center group flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold transition-all shadow-sm">
             <Download className="w-3.5 h-3.5 shrink-0" />
             <span className="hidden sm:inline">Planilha</span>
           </button>
           <button onClick={downloadPDF} className="flex-1 sm:flex-none justify-center group flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold transition-all shadow-sm">
             <Download className="w-3.5 h-3.5 shrink-0" />
             <span className="hidden sm:inline">PDF</span>
           </button>
           <button onClick={() => addItem(edital.id)} className="flex-1 sm:flex-none justify-center group flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-blue-900/20">
             <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform shrink-0" />
             Área
           </button>
           <button 
              onClick={() => safeConfirm("Excluir edital completo?") && deleteEdital(edital.id)} 
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all border border-slate-200 ml-1 shrink-0"
            >
             <Trash2 className="w-3.5 h-3.5" />
           </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-3 sm:px-6 pb-24 pt-4 overflow-hidden flex flex-col max-w-7xl mx-auto w-full">
        {/* Tabs Bar */}
        <div className="flex items-center gap-1 mb-4 sm:mb-6 bg-white shadow-sm p-1 rounded-xl border border-slate-200 w-full sm:w-fit overflow-x-auto whitespace-nowrap hide-scrollbar shrink-0">
          <button onClick={() => setActiveTab('topicos')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'topicos' ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20' : 'text-slate-500 hover:text-slate-800'}`}>
             <ListTodo className="w-3.5 h-3.5 shrink-0"/> Conteúdo
          </button>
          <button onClick={() => setActiveTab('revisoes')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'revisoes' ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20' : 'text-slate-500 hover:text-slate-800'}`}>
             <History className="w-3.5 h-3.5 shrink-0"/> Revisões
             {editalRevisions.length > 0 && <span className={`${activeTab === 'revisoes' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'} px-1 py-[1px] rounded text-[8px] ml-0.5`}>{editalRevisions.length}</span>}
          </button>
          <button onClick={() => setActiveTab('notas')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'notas' ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20' : 'text-slate-500 hover:text-slate-800'}`}>
             <FileText className="w-3.5 h-3.5 shrink-0"/> Notas
             {allNotes.length > 0 && <span className={`${activeTab === 'notas' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'} px-1 py-[1px] rounded text-[8px] ml-0.5`}>{allNotes.length}</span>}
          </button>
          <button onClick={() => setActiveTab('cartoes')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'cartoes' ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20' : 'text-slate-500 hover:text-slate-800'}`}>
             <Sparkles className="w-3.5 h-3.5 shrink-0"/> Cartões
          </button>
        </div>

        {activeTab === 'topicos' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Stats Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4 mb-4 shrink-0">
               <div className="flex-1 w-full sm:max-w-xs">
                  <div className="flex justify-between items-center mb-1.5">
                     <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Progresso Geral</span>
                     <span className="text-[11px] font-mono font-bold text-blue-800">{stats.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                     <div className="bg-gradient-to-r from-blue-900 to-blue-800 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.percent}%` }}></div>
                  </div>
               </div>

               <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 border border-slate-200 rounded-lg shrink-0 w-full sm:w-auto overflow-x-auto hide-scrollbar">
                  <button onClick={() => setFilter('all')} className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${filter==='all' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>Tudo</button>
                  <button onClick={() => setFilter('pending')} className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${filter==='pending' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>Pend.</button>
                  <button onClick={() => setFilter('completed')} className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${filter==='completed' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>Concl.</button>
               </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
               {edital.areas.map(area => (
                 <div key={area.id} className="mb-6 last:mb-16">
                   {/* Area Title */}
                   <div className="flex items-center gap-4 mb-4 group">
                      <div className="h-px bg-slate-200 flex-1"></div>
                      <div className="flex items-center gap-2">
                         {editingItemId === area.id ? (
                           <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, '', '', 'area')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, '', '', 'area')} className="bg-slate-50 text-slate-900 px-2 py-0.5 rounded border border-blue-900 text-[10px] font-bold uppercase tracking-[0.2em] outline-none" />
                         ) : (
                           <span onDoubleClick={() => handleEdit(area.id, area.area)} className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] cursor-text">{area.area}</span>
                         )}
                         <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setAiModal({isOpen: true, editalId: edital.id, areaId: area.id})} className="p-1 text-slate-400 hover:text-amber-500" title="Gerar Matéria com IA"><Sparkles className="w-3 h-3" /></button>
                            <button onClick={() => addItem(edital.id, area.id)} className="p-1 text-slate-400 hover:text-blue-800" title="Add Matéria"><Plus className="w-3 h-3" /></button>
                            <button onClick={() => safeConfirm("Excluir área?") && deleteItem(edital.id, area.id, '', '', 'area')} className="p-1 text-slate-400 hover:text-rose-400" title="Delete Área"><Trash2 className="w-3 h-3" /></button>
                         </div>
                      </div>
                      <div className="h-px bg-slate-200 flex-1"></div>
                   </div>

                   <Droppable droppableId={`materia|${area.id}`} isDropDisabled={filter !== 'all'}>
  {(provided) => (
    <div ref={provided.innerRef} {...provided.droppableProps}>
      {area.materias.map((materia, mIndex) => {
                     const isExp = expandedMaterias.includes(materia.id);
                     const visibleTopicos = materia.topicos.filter(t => {
                        const matchT = filter === 'all' || (filter === 'completed' && t.visto) || (filter === 'pending' && !t.visto);
                        const matchS = t.subtopicos.some(s => filter === 'all' || (filter === 'completed' && s.visto) || (filter === 'pending' && !s.visto));
                        return matchT || matchS;
                     });

                     if (visibleTopicos.length === 0 && filter !== 'all') return null;

                     let matTotal = 0;
                     let matDone = 0;
                     materia.topicos.forEach(t => {
                        matTotal++;
                        if (t.visto) matDone++;
                        t.subtopicos.forEach(s => {
                           matTotal++;
                           if (s.visto) matDone++;
                        });
                     });
                     const matProgress = matTotal === 0 ? 0 : Math.round((matDone / matTotal) * 100);

                     return (
                       // @ts-ignore
                       <Draggable key={materia.id} draggableId={materia.id} index={mIndex} isDragDisabled={filter !== 'all'}>
                         {(providedDrag) => (
                           <div 
                             ref={providedDrag.innerRef} 
                             {...providedDrag.draggableProps} 
                             style={{...providedDrag.draggableProps.style, zIndex: 10}}
                             className="mb-2 rounded-xl border border-slate-200 bg-white overflow-hidden group/mat transition-all hover:bg-white shadow-sm hover:border-slate-300">
                             <div className="flex items-center justify-between px-3 py-2">
                               {filter === 'all' && (
                                 <div {...providedDrag.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing mr-2">
                                   <GripVertical className="w-4 h-4" />
                                 </div>
                               )}
                             <button onClick={() => toggleMateria(materia.id)} className="flex items-center gap-3 flex-1 text-left">
                                <div className={`flex items-center justify-center w-5 h-5 rounded-md transition-all ${isExp ? 'bg-blue-900 text-white shadow-sm shadow-blue-900/20' : 'bg-slate-100 text-slate-500'}`}>
                                   {isExp ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </div>
                                {editingItemId === materia.id ? (
                                  <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, '', 'materia')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, '', 'materia')} onClick={e => e.stopPropagation()} className="bg-slate-50 text-slate-900 px-1.5 py-0.5 rounded border border-blue-900 text-[10px] font-bold outline-none" />
                                ) : (
                                  <span onDoubleClick={(e) => { e.stopPropagation(); handleEdit(materia.id, materia.nome); }} className="text-[11px] font-bold text-slate-800 tracking-wide uppercase cursor-text">{materia.nome}</span>
                                )}
                             </button>
                             <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end gap-0.5 mr-1 opacity-50 group-hover/mat:opacity-100 transition-opacity">
                                   <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] font-mono font-bold text-slate-500">{matProgress}%</span>
                                      <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                                         <div className="h-full bg-blue-900 transition-all" style={{ width: `${matProgress}%` }}></div>
                                      </div>
                                   </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover/mat:opacity-100 transition-opacity">
                                   <button onClick={() => addItem(edital.id, area.id, materia.id)} className="p-1 text-slate-400 hover:text-blue-800 bg-slate-100 rounded-md border border-slate-200" title="Add Tópico"><Plus className="w-3 h-3" /></button>
                                   <button onClick={() => safeConfirm("Excluir matéria?") && deleteItem(edital.id, area.id, materia.id, materia.id, 'materia')} className="p-1 text-slate-400 hover:text-rose-400 bg-slate-100 rounded-md border border-slate-200" title="Delete Matéria"><Trash2 className="w-3 h-3" /></button>
                                </div>
                             </div>
                          </div>

                          {isExp && (
                            <div className="bg-slate-50/40 border-t border-slate-200">
                               <Droppable droppableId={`topico|${area.id}|${materia.id}`} isDropDisabled={filter !== 'all'}>
  {(providedT) => (
    <div ref={providedT.innerRef} {...providedT.droppableProps}>
      {materia.topicos.map((topico, tIndex) => {
                                 const tMatch = filter === 'all' || (filter === 'completed' && topico.visto) || (filter === 'pending' && !topico.visto);
                                 const vSubs = topico.subtopicos.filter(s => filter === 'all' || (filter === 'completed' && s.visto) || (filter === 'pending' && !s.visto));
                                 
                                 if (!tMatch && vSubs.length === 0) return null;
                                 const nextRevT = getNextRevision(topico.revisoes_agendadas);
                                 const isDelayedT = nextRevT && isPast(nextRevT) && !isToday(nextRevT);
                                 const isDueTodayT = nextRevT && isToday(nextRevT);
                                 
                                 const topicoProgress = topico.subtopicos.length > 0 
                                    ? Math.round((topico.subtopicos.filter(s => s.visto).length / topico.subtopicos.length) * 100) 
                                    : null;

                                 return (
                                     // @ts-ignore
                                     <Draggable key={topico.id} draggableId={topico.id} index={tIndex} isDragDisabled={filter !== 'all'}>
                                       {(providedDragT) => (
                                         <div 
                                           ref={providedDragT.innerRef} 
                                           {...providedDragT.draggableProps} 
                                           style={{...providedDragT.draggableProps.style, zIndex: 10}}
                                           key={topico.id}>
                                      {tMatch && (
                                        <div className={`flex flex-col lg:grid lg:grid-cols-12 gap-y-2 lg:gap-y-0 border-b border-slate-200 py-1.5 sm:py-2 px-3 sm:px-4 items-start lg:items-center group/item transition-colors ${topico.visto ? 'bg-blue-900' : 'hover:bg-slate-50'}`}>
                                           <div className="lg:col-span-6 flex items-center gap-2 sm:gap-3 w-full">
                                              {filter === 'all' && (
                                                <div {...providedDragT.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing mr-1">
                                                  <GripVertical className="w-3.5 h-3.5" />
                                                </div>
                                              )}
                                              <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                                                <input type="checkbox" checked={topico.visto} className="peer sr-only" onChange={() => {
                                                   let cascade = false;
                                                   if (topico.subtopicos.length > 0) {
                                                      cascade = safeConfirm("Deseja aplicar esta alteração a todos os subtópicos?");
                                                   }
                                                   toggleVisto(edital.id, area.id, materia.id, topico.id, undefined, cascade);
                                                }} />
                                                <div className={`w-3.5 h-3.5 border rounded transition-all flex items-center justify-center ${topico.visto ? 'bg-blue-500 border-blue-500' : 'border-slate-300 peer-checked:bg-blue-500 peer-checked:border-blue-500'}`}>
                                                   <Check className={`w-2.5 h-2.5 transition-opacity ${topico.visto ? 'opacity-100 text-white' : 'opacity-0 peer-checked:opacity-100 text-white'}`} strokeWidth={3} />
                                                </div>
                                              </label>
                                              <div className={`text-[10px] font-medium flex-1 flex items-center gap-2 ${topico.visto ? 'text-white' : 'text-slate-800'}`}>
                                                {editingItemId === topico.id ? (
                                                  <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, topico.id, 'topico')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, topico.id, 'topico')} className={`bg-transparent w-full outline-none ${topico.visto ? 'text-white' : 'text-slate-900'}`} />
                                                ) : (
                                                  <span onDoubleClick={() => handleEdit(topico.id, topico.titulo)} className="cursor-text break-words w-full line-clamp-1 hover:line-clamp-none">{topico.titulo}</span>
                                                )}
                                                {topicoProgress !== null && topicoProgress > 0 && (
                                                   <span className={`text-[8px] font-bold px-1 py-0.5 rounded self-center shrink-0 ${topico.visto ? 'text-white bg-white/20' : 'text-blue-800 bg-blue-900/10'}`}>{topicoProgress}%</span>
                                                )}
                                              </div>
                                           </div>
                                           
                                           <div className="w-full lg:col-span-6 flex items-center justify-between lg:grid lg:grid-cols-6 gap-2 pl-6 lg:pl-0">
                                             <div className="lg:col-span-2 flex justify-center">
                                                <div className={`flex shadow-sm border rounded overflow-hidden text-[9px] ${topico.visto ? 'bg-white/10 border-white/20' : 'bg-white border-slate-300'}`}>
                                                   <input type="number" placeholder="Ac" value={topico.acertos ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, undefined, parseInt(e.target.value)||0, topico.erros||0)} className={`w-6 lg:w-7 text-center bg-transparent py-0.5 outline-none font-mono ${topico.visto ? 'text-emerald-300 placeholder-white/30' : 'text-emerald-500'}`} />
                                                   <div className={`w-px h-2.5 self-center ${topico.visto ? 'bg-white/20' : 'bg-slate-200'}`}></div>
                                                   <input type="number" placeholder="Er" value={topico.erros ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, undefined, topico.acertos||0, parseInt(e.target.value)||0)} className={`w-6 lg:w-7 text-center bg-transparent py-0.5 outline-none font-mono ${topico.visto ? 'text-rose-300 placeholder-white/30' : 'text-rose-500'}`} />
                                                </div>
                                             </div>
  
                                             <div className={`lg:col-span-1 text-center font-mono text-[9px] ${topico.visto ? 'text-white/70' : 'text-slate-500'}`}>
                                                <button onClick={() => setHistoryModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id })} className={`uppercase transition-colors ${topico.visto ? 'hover:text-white' : 'hover:text-blue-800'}`}>
                                                   {topico.data_estudo ? format(new Date(topico.data_estudo), "dd/MM") : "—"}
                                                </button>
                                             </div>
  
                                             <div className="lg:col-span-2 text-center font-mono text-[9px]">
                                                {nextRevT ? (
                                                  <button onClick={() => setHistoryModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id })} className={isDelayedT ? (topico.visto ? 'text-rose-200 hover:opacity-75' : 'text-rose-400 hover:opacity-75') : isDueTodayT ? (topico.visto ? 'text-amber-200 hover:opacity-75' : 'text-amber-400 hover:opacity-75') : (topico.visto ? 'text-white underline decoration-white/30 hover:opacity-75' : 'text-blue-800 underline decoration-blue-800/30 hover:opacity-75')}>
                                                    {format(new Date(nextRevT), "dd/MM")}
                                                  </button>
                                                ) : <span className={topico.visto ? 'text-white/50' : 'text-slate-500'}>—</span>}
                                             </div>
  
                                             <div className="lg:col-span-1 flex justify-end gap-0.5 opacity-100 lg:opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                <button onClick={() => setCartoesModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, cartoes: topico.cartoes || [], title: topico.titulo })} className={`p-1 ${topico.visto ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-indigo-500'}`}><Sparkles className="w-3 h-3" /></button>
                                                <button onClick={() => setNotesModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, currentNote: topico.notas || '', title: topico.titulo })} className={`p-1 ${topico.visto ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-amber-500'}`}><StickyNote className="w-3 h-3" /></button>
                                                <button onClick={() => addItem(edital.id, area.id, materia.id, topico.id)} className={`p-1 ${topico.visto ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-blue-800'}`}><Plus className="w-3 h-3" /></button>
                                                <button onClick={() => safeConfirm("Excluir tópico?") && deleteItem(edital.id, area.id, materia.id, topico.id, 'topico')} className={`p-1 ${topico.visto ? 'text-white/60 hover:text-rose-300' : 'text-slate-500 hover:text-rose-500'}`}><Trash2 className="w-3 h-3" /></button>
                                             </div>
                                           </div>
                                        </div>
                                      )}

                                      {topico.subtopicos.length > 0 && (
                                        <Droppable droppableId={`subtopico|${area.id}|${materia.id}|${topico.id}`} isDropDisabled={filter !== 'all'}>
                                          {(providedS) => (
                                            <div ref={providedS.innerRef} {...providedS.droppableProps} className="bg-white">
                                              {topico.subtopicos.map((sub, sIndex) => {
                                                const sMatch = filter === 'all' || (filter === 'completed' && sub.visto) || (filter === 'pending' && !sub.visto);
                                                if (!sMatch) return null;
                                                
                                                const nextRSub = getNextRevision(sub.revisoes_agendadas);
                                                const isDelayedS = nextRSub && isPast(nextRSub) && !isToday(nextRSub);
                                                const isDueTodayS = nextRSub && isToday(nextRSub);

                                                return (
                                                  // @ts-ignore
                                                  <Draggable key={sub.id} draggableId={sub.id} index={sIndex} isDragDisabled={filter !== 'all'}>
                                                    {(providedDragS) => (
                                                      <div 
                                                        ref={providedDragS.innerRef} 
                                                        {...providedDragS.draggableProps} 
                                                        style={{...providedDragS.draggableProps.style, zIndex: 10}}
                                                        className={`flex flex-col lg:grid lg:grid-cols-12 gap-y-2 lg:gap-y-0 border-b border-slate-200 py-1.5 px-3 sm:px-4 items-start lg:items-center group/sub transition-colors ${sub.visto ? 'bg-blue-900 border-blue-800' : 'hover:bg-slate-50'}`}>
                                                        <div className="lg:col-span-6 flex items-center gap-2 sm:gap-2.5 pl-0 sm:pl-4 w-full">
                                                          <CornerDownRight className={`w-3 h-3 shrink-0 ml-1 sm:ml-0 ${sub.visto ? 'text-white/40' : 'text-slate-400'}`} />
                                                          {filter === 'all' && (
                                                            <div {...providedDragS.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing mr-1">
                                                              <GripVertical className="w-3.5 h-3.5" />
                                                            </div>
                                                          )}
                                                          <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                                                            <input type="checkbox" checked={sub.visto} className="peer sr-only" onChange={() => toggleVisto(edital.id, area.id, materia.id, topico.id, sub.id)} />
                                                            <div className={`w-3 h-3 border rounded-sm transition-all flex items-center justify-center ${sub.visto ? 'bg-blue-500 border-blue-500' : 'border-slate-300 peer-checked:bg-blue-500 peer-checked:border-blue-500'}`}>
                                                              <Check className={`w-2 h-2 transition-opacity ${sub.visto ? 'opacity-100 text-white' : 'opacity-0 peer-checked:opacity-100 text-white'}`} strokeWidth={3} />
                                                            </div>
                                                          </label>
                                                          <div className={`text-[10px] flex-1 break-words w-full ${sub.visto ? 'text-white line-through opacity-80' : 'text-slate-600'}`}>
                                                            {editingItemId === sub.id ? (
                                                              <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, topico.id, 'subtopico', sub.id)} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, topico.id, 'subtopico', sub.id)} className={`bg-transparent w-full outline-none ${sub.visto ? 'text-white' : 'text-slate-900'}`} />
                                                            ) : (
                                                              <span onDoubleClick={() => handleEdit(sub.id, sub.titulo)} className="cursor-text line-clamp-1 hover:line-clamp-none">{sub.titulo}</span>
                                                            )}
                                                          </div>
                                                        </div>
                                                        
                                                        <div className="w-full lg:col-span-6 flex items-center justify-between lg:grid lg:grid-cols-6 gap-2 pl-6 sm:pl-4 lg:pl-0 mt-1 lg:mt-0">
                                                          <div className="lg:col-span-2 flex justify-center">
                                                            <div className={`flex border rounded text-[9px] opacity-70 ${sub.visto ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200'}`}>
                                                               <input type="number" placeholder="Ac" value={sub.acertos ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, sub.id, parseInt(e.target.value)||0, sub.erros||0)} className={`w-6 lg:w-7 text-center bg-transparent py-[1px] outline-none font-mono ${sub.visto ? 'text-emerald-300' : 'text-emerald-500'}`} />
                                                               <div className={`w-px h-2.5 self-center ${sub.visto ? 'bg-white/20' : 'bg-slate-200'}`}></div>
                                                               <input type="number" placeholder="Er" value={sub.erros ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, sub.id, sub.acertos||0, parseInt(e.target.value)||0)} className={`w-6 lg:w-7 text-center bg-transparent py-[1px] outline-none font-mono ${sub.visto ? 'text-rose-300' : 'text-rose-500'}`} />
                                                            </div>
                                                          </div>
      
                                                          <div className={`lg:col-span-1 text-center font-mono text-[9px] ${sub.visto ? 'text-white/70' : 'text-slate-400'}`}>
                                                            <button onClick={() => setHistoryModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, subtopicoId: sub.id })} className={`hover:opacity-75 transition-colors ${sub.visto ? 'hover:text-white' : 'hover:text-blue-800'}`}>
                                                               {sub.data_estudo ? format(new Date(sub.data_estudo), "dd/MM") : "—"}
                                                            </button>
                                                          </div>
      
                                                          <div className="lg:col-span-2 text-center font-mono text-[9px]">
                                                            {nextRSub ? (
                                                              <button onClick={() => setHistoryModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, subtopicoId: sub.id })} className={`hover:opacity-75 ${isDelayedS ? (sub.visto ? 'text-rose-200' : 'text-rose-500') : isDueTodayS ? (sub.visto ? 'text-amber-200' : 'text-amber-500') : (sub.visto ? 'text-white' : 'text-blue-800/80')}`}>
                                                                {format(new Date(nextRSub), "dd/MM")}
                                                              </button>
                                                            ) : <span className={sub.visto ? 'text-white/50' : 'text-slate-400'}>—</span>}
                                                          </div>
      
                                                          <div className="lg:col-span-1 flex justify-end gap-0.5 opacity-100 lg:opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                                            <button onClick={() => setCartoesModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, subtopicoId: sub.id, cartoes: sub.cartoes || [], title: sub.titulo })} className={`p-1 ${sub.visto ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-indigo-500'}`}><Sparkles className="w-2.5 h-2.5" /></button>
                                                            <button onClick={() => setNotesModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, subtopicoId: sub.id, currentNote: sub.notas || '', title: sub.titulo })} className={`p-1 ${sub.visto ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-amber-500'}`}><StickyNote className="w-2.5 h-2.5" /></button>
                                                            <button onClick={() => safeConfirm("Excluir subtópico?") && deleteItem(edital.id, area.id, materia.id, sub.id, 'subtopico', topico.id)} className={`p-1 ${sub.visto ? 'text-white/60 hover:text-rose-300' : 'text-slate-400 hover:text-rose-500'}`}><Trash2 className="w-2.5 h-2.5" /></button>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </Draggable>
                                                );
                                              })}
                                              {providedS.placeholder}
                                            </div>
                                          )}
                                        </Droppable>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                               );
                             })}
                             {providedT.placeholder}
                           </div>
                         )}
                       </Droppable>
                     </div>
                   )}
                 </div>
               )}
             </Draggable>
           );
         })}
         {provided.placeholder}
       </div>
     )}
   </Droppable>
 </div>
))}
            </div>
          </div>
        )}

        {activeTab === 'revisoes' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
             <div className="mb-8 shrink-0">
                <h3 className="text-lg font-display font-bold text-slate-900 mb-2">Revisões Programadas</h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Tópicos que exigem retorno hoje ou estão atrasados</p>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {editalRevisions.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center bg-white shadow-sm border border-slate-200 rounded-3xl border-dashed">
                     <CheckCircle2 className="w-10 h-10 text-slate-900/5 mb-4" />
                     <p className="text-slate-500 font-medium tracking-tight">Todas as metas de revisão em dia!</p>
                  </div>
                ) : (
                  editalRevisions.map((rev, i) => (
                    <div key={i} className={`p-6 rounded-2xl border ${rev.atrasada ? 'bg-rose-500/5 border-rose-500/20' : isToday(new Date(rev.dataRevisao)) ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white shadow-sm border-slate-200'} transition-all hover:border-slate-300 group`}>
                       <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                          <div>
                             <div className="flex items-center gap-3 mb-2">
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-800 bg-blue-900/10 px-2 py-0.5 rounded border border-blue-900/20">{rev.materiaNome}</span>
                                {rev.atrasada && <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Atrasada</span>}
                             </div>
                             <h4 className="text-base font-bold text-slate-900 mb-1">{rev.tituloItem}</h4>
                             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">{rev.areaNome}</p>
                          </div>
                          <div className="flex items-center gap-6">
                             <div className="text-right">
                                <div className={`text-sm font-mono font-bold ${rev.atrasada ? 'text-rose-400' : isToday(new Date(rev.dataRevisao)) ? 'text-amber-400' : 'text-slate-400'}`}>
                                   {format(new Date(rev.dataRevisao), "dd MMM, yyyy")}
                                </div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">
                                   {rev.atrasada ? `${rev.diasAtraso} ${rev.diasAtraso === 1 ? 'dia' : 'dias'} de atraso` : 'Agendado para hoje'}
                                </div>
                             </div>
                             <button onClick={() => setHistoryModal({ isOpen: true, areaId: rev.areaId, materiaId: rev.materiaId, topicoId: rev.topicoOuSubId })} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200">
                                <History className="w-4 h-4 text-slate-400" />
                             </button>
                          </div>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}

        {activeTab === 'notas' && (
           <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="mb-8 shrink-0">
                 <h3 className="text-lg font-display font-bold text-slate-900 mb-2">Anotações do Edital</h3>
                 <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Consolidado de mnemônicos e resumos</p>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                 {allNotes.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-white shadow-sm border border-slate-200 rounded-3xl border-dashed">
                       <FileText className="w-10 h-10 text-slate-900/5 mb-4" />
                       <p className="text-slate-500 font-medium tracking-tight">Nenhuma anotação vinculada.</p>
                       <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">Clique nos tópicos para adicionar notas</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {allNotes.map((note, i) => (
                          <div key={i} className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col h-full group">
                             <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-200">
                                <div>
                                   <div className="text-[9px] uppercase font-bold text-blue-800 tracking-[0.2em] mb-1.5">{note.materia}</div>
                                   <h4 className="font-bold text-slate-900 text-sm leading-snug">{note.subtopico || note.topico}</h4>
                                </div>
                                <button className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-amber-400 transition-colors" onClick={() => setNotesModal({ isOpen: true, areaId: note.areaId, materiaId: note.materiaId, topicoId: note.topicoId, subtopicoId: note.subtopicoId, currentNote: note.notas, title: note.subtopico || note.topico })}>
                                   <Edit2 className="w-3.5 h-3.5"/>
                                </button>
                             </div>
                             <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap flex-1 break-words">
                                {note.notas}
                             </p>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        )}

        {activeTab === 'cartoes' && (
           <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="mb-8 shrink-0">
                 <h3 className="text-lg font-display font-bold text-slate-900 mb-2">Cartões de Estudo</h3>
                 <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Flashcards para revisão espaçada</p>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                 {allCartoes.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-white shadow-sm border border-slate-200 rounded-3xl border-dashed">
                       <Sparkles className="w-10 h-10 text-slate-900/5 mb-4" />
                       <p className="text-slate-500 font-medium tracking-tight">Nenhum cartão (flashcard) gerado.</p>
                       <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">Clique no botão de estrela nos tópicos para criar cartões</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                       {allCartoes.map((item, i) => (
                          <div key={i} className="bg-white shadow-sm rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-col h-full overflow-hidden group">
                             <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-start gap-2">
                                <div>
                                   <div className="text-[9px] uppercase font-bold text-blue-800 tracking-[0.2em] mb-1">{item.materia}</div>
                                   <h4 className="font-bold text-slate-700 text-xs truncate max-w-[150px]">{item.subtopico || item.topico}</h4>
                                </div>
                                <button className="p-1.5 bg-white border border-slate-200 rounded text-slate-400 hover:text-indigo-500 transition-colors shadow-sm" onClick={() => {
                                   const t = edital.areas.find(a=>a.id===item.areaId)?.materias.find(m=>m.id===item.materiaId)?.topicos.find(t=>t.id===item.topicoId);
                                   const c = item.subtopicoId ? t?.subtopicos.find(s=>s.id===item.subtopicoId)?.cartoes : t?.cartoes;
                                   setCartoesModal({ isOpen: true, areaId: item.areaId, materiaId: item.materiaId, topicoId: item.topicoId, subtopicoId: item.subtopicoId, cartoes: c || [], title: item.subtopico || item.topico });
                                }}>
                                   <Edit2 className="w-3 h-3"/>
                                </button>
                             </div>
                             <div className="p-5 flex-1 flex flex-col justify-center items-center text-center">
                                <p className="text-sm font-medium text-slate-900 mb-4">{item.cartao.pergunta}</p>
                                <div className="hidden group-hover:block w-full border-t border-dashed border-slate-200 pt-4 mt-2">
                                   <p className="text-xs text-emerald-700 font-medium">{item.cartao.resposta}</p>
                                </div>
                                <p className="text-[10px] text-slate-400 block group-hover:hidden mt-auto pt-4 italic">Passe o mouse para ver a resposta</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        )}
      </div>

      {/* Modals */}
      {cartoesModal?.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-slate-50 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
               <div>
                 <h3 className="text-lg font-display font-bold text-slate-900">Cartões de Estudo (Flashcards)</h3>
                 <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">{cartoesModal.title}</p>
               </div>
               <button onClick={() => setCartoesModal(null)} className="text-slate-500 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-xl transition-all"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-4 bg-slate-50/50 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar flex flex-col gap-4">
                <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm shrink-0">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Gerador Inteligente</span>
                     <span className="text-[10px] text-slate-400">Cole um texto para focar nos cartões criados gerados</span>
                   </div>
                   <textarea
                       value={cartoesBaseText}
                       onChange={e => setCartoesBaseText(e.target.value)}
                       placeholder="Cole aqui a lei seca, PDF, ou anotações para a IA criar cartões especificamente sobre este texto..."
                       className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none focus:border-indigo-300 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                   />
                </div>

                {cartoesModal.cartoes?.length === 0 ? (
                   <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                      <Sparkles className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="font-medium text-sm">Nenhum cartão gerado ainda.</p>
                      <p className="text-xs text-slate-400 mt-2 max-w-sm">Use a Inteligência Artificial para gerar cartões de memorização (Perguntas e Respostas) baseados no conteúdo deste tópico.</p>
                   </div>
                ) : (
                   <div className="space-y-4">
                      {cartoesModal.cartoes.map((cartao, i) => (
                         <div key={cartao.id || i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group">
                            <button onClick={() => {
                               const newCartoes = cartoesModal.cartoes.filter(c => c.id !== cartao.id);
                               setCartoesModal(prev => prev ? { ...prev, cartoes: newCartoes } : null);
                            }} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                               <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="mb-3">
                               <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1 block">Pergunta</span>
                               <textarea
                                 value={cartao.pergunta}
                                 onChange={(e) => {
                                   const newCartoes = [...cartoesModal.cartoes];
                                   newCartoes[i].pergunta = e.target.value;
                                   setCartoesModal(prev => prev ? { ...prev, cartoes: newCartoes } : null);
                                 }}
                                 className="w-full text-sm font-medium text-slate-900 bg-slate-50 p-3 rounded-xl border border-transparent focus:border-indigo-200 focus:bg-white outline-none resize-none transition-all focus:ring-4 focus:ring-indigo-500/10"
                                 rows={2}
                               />
                            </div>
                            <div>
                               <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 block">Resposta</span>
                               <textarea
                                 value={cartao.resposta}
                                 onChange={(e) => {
                                   const newCartoes = [...cartoesModal.cartoes];
                                   newCartoes[i].resposta = e.target.value;
                                   setCartoesModal(prev => prev ? { ...prev, cartoes: newCartoes } : null);
                                 }}
                                 className="w-full text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-transparent focus:border-emerald-200 focus:bg-white outline-none resize-none transition-all focus:ring-4 focus:ring-emerald-500/10"
                                 rows={3}
                               />
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
             <div className="p-6 border-t border-slate-200 flex justify-between gap-3 bg-white shrink-0">
                <button 
                  onClick={handleGenerateFlashcards} 
                  disabled={cartoesAiLoading}
                  className="px-4 py-2.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-all flex items-center gap-2 uppercase tracking-widest disabled:opacity-50"
                  title="Gerar novos cartões (Flashcards) com IA. Será adicionado ao final da lista atual."
                >
                   {cartoesAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                   {cartoesAiLoading ? "Gerando..." : "Gerar Cartões (IA)"}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => {
                     const novo = { id: Math.random().toString(36).substring(7), pergunta: "", resposta: "" };
                     setCartoesModal(prev => prev ? { ...prev, cartoes: [...prev.cartoes, novo] } : null);
                  }} className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all uppercase tracking-widest hidden sm:block">Adicionar Manual</button>
                  <button onClick={() => setCartoesModal(null)} className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">Cancelar</button>
                  <button onClick={() => { 
                     // filter out empty
                     const finalCartoes = cartoesModal.cartoes.filter(c => c.pergunta.trim() || c.resposta.trim());
                     updateCartoes(edital.id, cartoesModal.areaId, cartoesModal.materiaId, cartoesModal.topicoId, cartoesModal.subtopicoId, finalCartoes); 
                     setCartoesModal(null); 
                  }} className="px-6 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-lg shadow-blue-900/20 transition-all uppercase tracking-widest">Salvar</button>
                </div>
             </div>
           </div>
        </div>
      )}

      {notesModal?.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-slate-50 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
               <div>
                 <h3 className="text-lg font-display font-bold text-slate-900">Anotações</h3>
                 <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">{notesModal.title}</p>
               </div>
               <button onClick={() => setNotesModal(null)} className="text-slate-500 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-xl transition-all"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-4 bg-slate-50/50">
                <textarea 
                  autoFocus
                  placeholder="Escreva seus mnemônicos, gatilhos mentais ou resumos técnicos aqui..."
                  className="w-full h-80 p-5 outline-none resize-none text-[13px] text-slate-800 bg-white rounded-2xl border border-slate-200 focus:border-blue-900/30 transition-all placeholder:text-slate-400 font-mono"
                  value={notesModal.currentNote}
                  onChange={(e) => setNotesModal({ ...notesModal, currentNote: e.target.value })}
                  disabled={notesAiLoading}
                />
             </div>
             <div className="p-6 border-t border-slate-200 flex justify-between gap-3 bg-white">
                <button 
                  onClick={handleGenerateNotes} 
                  disabled={notesAiLoading}
                  className="px-4 py-2.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-all flex items-center gap-2 uppercase tracking-widest disabled:opacity-50"
                  title="A IA analisará a matéria e criará resumos estruturados e tabelas automaticamente."
                >
                   {notesAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                   {notesAiLoading ? "Gerando..." : "Gerar Resumo (IA)"}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setNotesModal(null)} className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">Cancelar</button>
                  <button onClick={() => { updateNota(edital.id, notesModal.areaId, notesModal.materiaId, notesModal.topicoId, notesModal.subtopicoId, notesModal.currentNote); setNotesModal(null); }} className="px-6 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-lg shadow-blue-900/20 transition-all uppercase tracking-widest">Salvar Nota</button>
                </div>
             </div>
           </div>
        </div>
      )}

      {historyModal?.isOpen && historyItemInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-slate-50 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
               <div>
                 <h3 className="font-display text-lg font-bold text-slate-900">Histórico</h3>
                 <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest truncate max-w-[200px]">{historyItemInfo.titulo}</p>
               </div>
               <button onClick={() => setHistoryModal(null)} className="text-slate-500 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-xl transition-all"><X className="w-5 h-5"/></button>
             </div>
             
             <div className="p-6 flex flex-col gap-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div>
                   <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Primeiro Registro</h4>
                   <div className="flex items-center gap-4 bg-white shadow-sm p-4 rounded-2xl border border-slate-200">
                      <div className="w-10 h-10 rounded-xl bg-blue-900/10 text-blue-800 flex items-center justify-center shrink-0 border border-blue-900/20">
                         <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                         <input 
                            type="date"
                            className="bg-transparent text-sm font-mono font-bold text-slate-900 outline-none w-full cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
                            value={historyItemInfo.data_estudo ? historyItemInfo.data_estudo.split('T')[0] : ''}
                            onChange={(e) => {
                               const dateStr = e.target.value ? new Date(e.target.value + 'T12:00:00').toISOString() : null;
                               let cascade = false;
                               if (dateStr && !historyModal.subtopicoId && historyItemInfo?.subtopicos?.length > 0) {
                                  cascade = safeConfirm("Deseja aplicar esta data de estudo a todos os subtópicos?");
                               }
                               setStudyDate(edital.id, historyModal.areaId, historyModal.materiaId, historyModal.topicoId, historyModal.subtopicoId, dateStr, cascade);
                            }}
                         />
                         <div className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">{historyItemInfo.data_estudo ? 'Estudo Concluído' : 'Adicionar Data de Estudo'}</div>
                      </div>
                   </div>
                </div>

                <div>
                   <div className="flex items-center justify-between mb-4">
                     <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Fila de Revisões</h4>
                     <label className="text-blue-800 hover:text-indigo-300 font-bold text-[9px] uppercase tracking-widest flex items-center gap-1.5 cursor-pointer bg-blue-900/10 px-2.5 py-1.5 rounded-lg border border-blue-900/20 transition-all">
                        <Plus className="w-3 h-3" /> Add Data
                        <input type="date" className="hidden" onChange={(e) => {
                          if(e.target.value) {
                             const dateStr = new Date(e.target.value + 'T12:00:00').toISOString();
                             let cascade = false;
                             if (!historyModal.subtopicoId && historyItemInfo?.subtopicos?.length > 0) {
                                cascade = safeConfirm("Deseja aplicar esta data de revisão a todos os subtópicos?");
                             }
                             addCustomRevisionDate(edital.id, historyModal.areaId, historyModal.materiaId, historyModal.topicoId, historyModal.subtopicoId, dateStr, cascade);
                          }
                        }} />
                     </label>
                   </div>
                   
                   {historyItemInfo.revisoes_agendadas?.length > 0 ? (
                      <div className="flex flex-col gap-3">
                         {historyItemInfo.revisoes_agendadas
                            .map((d: string) => ({ raw: d, obj: new Date(d) }))
                            .sort((a: any, b: any) => a.obj.getTime() - b.obj.getTime())
                            .map((dateItem: any, idx: number) => {
                               const date = dateItem.obj;
                               const isP = isPast(date) && !isToday(date);
                               const isT = isToday(date);
                               return (
                                 <div key={idx} className={`flex items-center justify-between group p-3.5 rounded-2xl border transition-all ${isP ? 'bg-rose-500/5 border-rose-500/10' : isT ? 'bg-amber-500/5 border-amber-500/10' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                   <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isP ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : isT ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                         <History className="w-5 h-5" />
                                      </div>
                                      <div>
                                         <input 
                                             type="date"
                                             className={`bg-transparent text-sm font-mono font-bold outline-none cursor-pointer p-1 rounded hover:opacity-80 transition-opacity ${isP ? 'text-rose-400 hover:bg-rose-50' : isT ? 'text-amber-400 hover:bg-amber-50' : 'text-slate-800 hover:bg-slate-100'}`}
                                             value={dateItem.raw.split('T')[0]}
                                             onChange={(e) => {
                                                if(e.target.value) {
                                                   const newDateStr = new Date(e.target.value + 'T12:00:00').toISOString();
                                                   let cascade = false;
                                                   if (!historyModal.subtopicoId && historyItemInfo?.subtopicos?.length > 0) {
                                                      cascade = safeConfirm("Deseja aplicar esta alteração de data a todos os subtópicos?");
                                                   }
                                                   removeRevisionDate(edital.id, historyModal.areaId, historyModal.materiaId, historyModal.topicoId, historyModal.subtopicoId, dateItem.raw, cascade);
                                                   addCustomRevisionDate(edital.id, historyModal.areaId, historyModal.materiaId, historyModal.topicoId, historyModal.subtopicoId, newDateStr, cascade);
                                                }
                                             }}
                                          />
                                         <div className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest px-1">{isP ? 'Atrasada' : isT ? 'Hoje' : 'Agendada'}</div>
                                      </div>
                                   </div>
                                   <button 
                                     onClick={() => {
                                        let cascade = false;
                                        if (!historyModal.subtopicoId && historyItemInfo?.subtopicos?.length > 0) {
                                           cascade = safeConfirm("Deseja remover esta data de todos os subtópicos também?");
                                        }
                                        removeRevisionDate(edital.id, historyModal.areaId, historyModal.materiaId, historyModal.topicoId, historyModal.subtopicoId, dateItem.raw, cascade);
                                     }} 
                                     className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 p-2.5 transition-all bg-slate-100 rounded-xl border border-slate-200" title="Remover">
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                 </div>
                               );
                            })}
                      </div>
                   ) : (
                      <div className="text-xs text-slate-400 italic bg-white p-5 rounded-2xl border border-slate-200 text-center">Sem revisões programadas.</div>
                   )}
                </div>
             </div>
             
             <div className="p-6 border-t border-slate-200 flex justify-end bg-white">
                <button onClick={() => setHistoryModal(null)} className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors">Fechar</button>
             </div>
           </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {aiModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-50 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200/60 flex flex-col max-h-[90vh]">
            <div className="flex items-center gap-4 py-5 px-6 sm:px-8 border-b border-slate-200 bg-white">
              <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-slate-800 text-lg">Gerar Matéria com IA</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Cole o texto do edital contendo a matéria, tópicos e subtópicos.</p>
              </div>
              <button 
                 onClick={() => {
                   if(aiLoading) return;
                   setAiModal(null);
                   setAiText("");
                   setAiError("");
                 }} 
                 className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-all"
                 disabled={aiLoading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
              <textarea 
                 value={aiText}
                 onChange={e => setAiText(e.target.value)}
                 className="w-full h-48 sm:h-64 p-4 text-sm bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none custom-scrollbar"
                 placeholder="Ex: LÍNGUA PORTUGUESA: 1 Compreensão e interpretação de textos..."
                 disabled={aiLoading}
              ></textarea>
              {aiError && (
                <div className="mt-4 text-xs font-medium text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">
                  {aiError}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-white shrink-0">
               <button 
                 onClick={() => {
                   if(aiLoading) return;
                   setAiModal(null);
                   setAiText("");
                   setAiError("");
                 }} 
                 disabled={aiLoading}
                 className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors disabled:opacity-50"
               >
                 Cancelar
               </button>
               <button 
                  onClick={async () => {
                    if (!aiText.trim()) return;
                    setAiLoading(true);
                    setAiError("");
                    try {
                      const parsed = await parseEditalText(aiText);
                      const materiasToAdd: any[] = [];
                      parsed.forEach((a: any) => materiasToAdd.push(...a.materias));
                      if (materiasToAdd.length > 0) {
                        addMaterias(aiModal.editalId, aiModal.areaId, materiasToAdd);
                        setAiModal(null);
                        setAiText("");
                      } else {
                        setAiError("Não foi possível extrair matérias deste texto.");
                      }
                    } catch (err: any) {
                      setAiError(err?.message || "Erro ao conectar com a IA.");
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                  disabled={!aiText.trim() || aiLoading}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
               >
                  {aiLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Gerando...</> : 'Gerar Matéria'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-slate-50 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
               <div>
                 <h3 className="text-lg font-display font-bold text-slate-900">Compartilhar Edital</h3>
                 <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest truncate max-w-[200px]">{edital.titulo}</p>
               </div>
               <button onClick={() => setShareModal(null)} className="text-slate-500 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-xl transition-all"><X className="w-5 h-5"/></button>
             </div>
             
             <div className="p-6 flex flex-col max-h-[60vh] overflow-y-auto custom-scrollbar">
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-6 bg-slate-100 p-3 rounded-xl border border-slate-200">
                   Selecione os ciclos de estudo que deseja incluir no compartilhamento. O usuário que receber o link irá importar o edital e os ciclos marcados abaixo.
                </p>
                
                {editalCiclos.length > 0 ? (
                   <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seus Ciclos</span>
                        <button 
                          onClick={() => {
                            setShareModal(prev => {
                              if (!prev) return prev;
                              const allSelected = prev.selectedCiclos.length === editalCiclos.length;
                              return { 
                                ...prev, 
                                selectedCiclos: allSelected ? [] : editalCiclos.map(c => c.id) 
                              };
                            });
                          }}
                          className="text-[10px] font-bold text-blue-800 hover:text-blue-900 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded"
                        >
                          {shareModal.selectedCiclos.length === editalCiclos.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </button>
                      </div>
                      
                      {editalCiclos.map(ciclo => {
                         const isSelected = shareModal.selectedCiclos.includes(ciclo.id);
                         return (
                            <label key={ciclo.id} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'border-blue-900 bg-blue-900/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'}`}>
                               <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-900 border-blue-900 text-white' : 'border-slate-300 bg-white'}`}>
                                  {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                               </div>
                               <div className="flex-1">
                                  <span className={`text-[12px] font-bold block ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>{ciclo.nome}</span>
                                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-medium">Ciclo de Estudo</span>
                               </div>
                               <input 
                                  type="checkbox" 
                                  className="hidden" 
                                  checked={isSelected}
                                  onChange={() => {
                                     setShareModal(prev => {
                                        if (!prev) return prev;
                                        if (isSelected) {
                                           return { ...prev, selectedCiclos: prev.selectedCiclos.filter(id => id !== ciclo.id) };
                                        } else {
                                           return { ...prev, selectedCiclos: [...prev.selectedCiclos, ciclo.id] };
                                        }
                                     });
                                  }}
                               />
                            </label>
                         );
                      })}
                   </div>
                ) : (
                   <div className="text-xs text-slate-400 italic bg-white p-5 rounded-2xl border border-slate-200 text-center">Nenhum ciclo associado a este edital.</div>
                )}
             </div>
             
             <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-white flex-wrap">
                <button onClick={() => setShareModal(null)} className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">Cancelar</button>
                <div className="flex gap-2">
                   <button disabled={isSharing} onClick={() => handleShareSubmit('code')} className="px-4 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
                      {isSharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Hash className="w-3.5 h-3.5" />}
                      Gerar Código
                   </button>
                   <button disabled={isSharing} onClick={() => handleShareSubmit('link')} className="px-6 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-lg shadow-blue-900/20 transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
                      {isSharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                      Link
                   </button>
                </div>
             </div>
           </div>
        </div>
      )}
      </div>
    </DragDropContext>
  );
}
