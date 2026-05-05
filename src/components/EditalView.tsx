import React, { useState } from "react";
import { useEdital } from "../store";
import { format, isPast, isToday } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Edital } from "../types";
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit2, 
  Trash2, 
  CalendarIcon, 
  StickyNote, 
  X, 
  History, 
  CheckCircle2, 
  ListTodo, 
  FileText, 
  BookOpen, 
  CornerDownRight,
  Download
} from "lucide-react";

export function EditalView({ edital }: { edital: Edital, key?: string | number }) {
  const { 
    deleteEdital, 
    toggleVisto, 
    updateItemTitle, 
    deleteItem, 
    addItem, 
    setNextRevisionDate, 
    addCustomRevisionDate, 
    removeRevisionDate, 
    setStudyDate, 
    updateNota, 
    updateMetricas, 
    revisions 
  } = useEdital();

  const [expandedMaterias, setExpandedMaterias] = useState<string[]>(() => {
    return edital.areas[0]?.materias[0] ? [edital.areas[0].materias[0].id] : [];
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState<'topicos' | 'revisoes' | 'notas'>('topicos');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [notesModal, setNotesModal] = useState<{ isOpen: boolean, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string, currentNote: string, title: string } | null>(null);
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string } | null>(null);

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

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.text(`Edital: ${edital.titulo}`, 14, 20);

    const tableData: any[] = [];
    edital.areas.forEach(area => {
      tableData.push([{ content: `ÁREA: ${area.titulo}`, colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
      area.materias.forEach(materia => {
        tableData.push([{ content: `MATÉRIA: ${materia.titulo}`, colSpan: 2, styles: { fillColor: [245, 245, 245], fontStyle: 'bold', textColor: [50, 50, 50] } }]);
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
    <div className="flex-1 flex flex-col h-full bg-slate-50 selection:bg-blue-900/30 font-sans text-slate-800">
      {/* Header */}
      <header className="h-20 px-8 flex items-center justify-between shrink-0 border-b border-slate-200 bg-slate-50/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex flex-col">
          <h2 className="text-xl font-display font-semibold text-slate-900 leading-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-800" />
            {editingItemId === edital.id ? (
              <input
                 autoFocus
                 value={editValue}
                 onChange={(e) => setEditValue(e.target.value)}
                 onBlur={() => saveEdit('', '', '', 'edital', edital.id)}
                 onKeyDown={(e) => e.key === 'Enter' && saveEdit('', '', '', 'edital', edital.id)}
                 className="bg-transparent text-slate-900 outline-none border-b border-blue-800"
              />
            ) : (
              <span onDoubleClick={() => handleEdit(edital.id, edital.titulo)} className="cursor-text">{edital.titulo}</span>
            )}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-blue-800 font-bold uppercase tracking-[0.2em] bg-blue-900/10 px-2 py-0.5 rounded border border-blue-900/20">Edital Ativo</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{stats.completed} de {stats.total} concluídos</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={downloadPDF} className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm">
             <Download className="w-4 h-4" />
             PDF
           </button>
           <button onClick={() => addItem(edital.id)} className="group flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/20">
             <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
             Área
           </button>
           <button 
              onClick={() => confirm("Excluir edital completo?") && deleteEdital(edital.id)} 
              className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all border border-slate-200 ml-2"
            >
             <Trash2 className="w-4 h-4" />
           </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-8 pb-32 pt-8 overflow-hidden flex flex-col max-w-7xl mx-auto w-full">
        {/* Tabs Bar */}
        <div className="flex items-center gap-1 mb-10 bg-white shadow-sm p-1.5 rounded-2xl border border-slate-200 w-fit">
          <button onClick={() => setActiveTab('topicos')} className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'topicos' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-800'}`}>
             <ListTodo className="w-4 h-4"/> Conteúdo
          </button>
          <button onClick={() => setActiveTab('revisoes')} className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'revisoes' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-800'}`}>
             <History className="w-4 h-4"/> Revisões
             {editalRevisions.length > 0 && <span className={`${activeTab === 'revisoes' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'} px-1.5 py-0.5 rounded text-[9px] ml-1`}>{editalRevisions.length}</span>}
          </button>
          <button onClick={() => setActiveTab('notas')} className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'notas' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-800'}`}>
             <FileText className="w-4 h-4"/> Notas
             {allNotes.length > 0 && <span className={`${activeTab === 'notas' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'} px-1.5 py-0.5 rounded text-[9px] ml-1`}>{allNotes.length}</span>}
          </button>
        </div>

        {activeTab === 'topicos' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Stats Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-10 shrink-0">
               <div className="flex-1 w-full max-w-md">
                  <div className="flex justify-between items-center mb-2.5">
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Progresso Geral</span>
                     <span className="text-sm font-mono font-bold text-blue-800">{stats.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                     <div className="bg-gradient-to-r from-blue-900 to-blue-800 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.percent}%` }}></div>
                  </div>
               </div>

               <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl shrink-0">
                  <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter==='all' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>Tudo</button>
                  <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter==='pending' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>Pendentes</button>
                  <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter==='completed' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>Concluídos</button>
               </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
               {edital.areas.map(area => (
                 <div key={area.id} className="mb-12 last:mb-32">
                   {/* Area Title */}
                   <div className="flex items-center gap-6 mb-6 group">
                      <div className="h-px bg-slate-100 flex-1"></div>
                      <div className="flex items-center gap-3">
                         {editingItemId === area.id ? (
                           <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, '', '', 'area')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, '', '', 'area')} className="bg-slate-50 text-slate-900 px-3 py-1 rounded border border-blue-900 text-[11px] font-bold uppercase tracking-[0.2em] outline-none" />
                         ) : (
                           <span onDoubleClick={() => handleEdit(area.id, area.area)} className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] cursor-text">{area.area}</span>
                         )}
                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => addItem(edital.id, area.id)} className="p-1 text-slate-400 hover:text-blue-800" title="Add Matéria"><Plus className="w-3.5 h-3.5" /></button>
                            <button onClick={() => confirm("Excluir área?") && deleteItem(edital.id, area.id, '', '', 'area')} className="p-1 text-slate-400 hover:text-rose-400" title="Delete Área"><Trash2 className="w-3.5 h-3.5" /></button>
                         </div>
                      </div>
                      <div className="h-px bg-slate-100 flex-1"></div>
                   </div>

                   {area.materias.map(materia => {
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
                       <div key={materia.id} className="mb-3 rounded-2xl border border-slate-200 bg-white overflow-hidden group/mat transition-all hover:bg-white shadow-sm hover:border-slate-300">
                          <div className="flex items-center justify-between px-6 py-4">
                             <button onClick={() => toggleMateria(materia.id)} className="flex items-center gap-4 flex-1 text-left">
                                <div className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all ${isExp ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-100 text-slate-500'}`}>
                                   {isExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </div>
                                {editingItemId === materia.id ? (
                                  <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, '', 'materia')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, '', 'materia')} onClick={e => e.stopPropagation()} className="bg-slate-50 text-slate-900 px-2 py-1 rounded border border-blue-900 text-xs font-bold outline-none" />
                                ) : (
                                  <span onDoubleClick={(e) => { e.stopPropagation(); handleEdit(materia.id, materia.nome); }} className="text-xs font-bold text-slate-800 tracking-wide uppercase cursor-text">{materia.nome}</span>
                                )}
                             </button>
                             <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end gap-1 mr-2 opacity-50 group-hover/mat:opacity-100 transition-opacity">
                                   <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono font-bold text-slate-500">{matProgress}%</span>
                                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                         <div className="h-full bg-blue-900 transition-all" style={{ width: `${matProgress}%` }}></div>
                                      </div>
                                   </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover/mat:opacity-100 transition-opacity">
                                   <button onClick={() => addItem(edital.id, area.id, materia.id)} className="p-1.5 text-slate-400 hover:text-blue-800 bg-slate-100 rounded-lg border border-slate-200" title="Add Tópico"><Plus className="w-3.5 h-3.5" /></button>
                                   <button onClick={() => confirm("Excluir matéria?") && deleteItem(edital.id, area.id, materia.id, materia.id, 'materia')} className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-100 rounded-lg border border-slate-200" title="Delete Matéria"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                             </div>
                          </div>

                          {isExp && (
                            <div className="bg-slate-50/40 border-t border-slate-200">
                               {materia.topicos.map(topico => {
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
                                     <div key={topico.id}>
                                      {tMatch && (
                                        <div className={`grid lg:grid-cols-12 border-b border-slate-200 py-4 px-8 items-center group/item transition-colors ${topico.visto ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                                           <div className="col-span-6 flex items-center gap-4">
                                              <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                                                <input type="checkbox" checked={topico.visto} className="peer sr-only" onChange={() => toggleVisto(edital.id, area.id, materia.id, topico.id)} />
                                                <div className="w-4 h-4 border border-slate-300 rounded peer-checked:bg-blue-900 peer-checked:border-blue-900 transition-all flex items-center justify-center">
                                                   <CheckCircle2 className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                </div>
                                              </label>
                                              <div className={`text-[11px] font-medium flex-1 flex items-center gap-3 ${topico.visto ? 'text-slate-500' : 'text-slate-800'}`}>
                                                {editingItemId === topico.id ? (
                                                  <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, topico.id, 'topico')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, topico.id, 'topico')} className="bg-transparent text-slate-900 w-full outline-none" />
                                                ) : (
                                                  <span onDoubleClick={() => handleEdit(topico.id, topico.titulo)} className="cursor-text">{topico.titulo}</span>
                                                )}
                                                {topicoProgress !== null && topicoProgress > 0 && (
                                                   <span className="text-[9px] font-bold text-blue-800 bg-blue-900/10 px-1.5 py-0.5 rounded-md self-center">{topicoProgress}%</span>
                                                )}
                                              </div>
                                           </div>
                                           
                                           <div className="col-span-2 flex justify-center">
                                              <div className="flex bg-white shadow-sm border border-slate-300 rounded-md overflow-hidden text-[10px]">
                                                 <input type="number" placeholder="Ac." value={topico.acertos ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, undefined, parseInt(e.target.value)||0, topico.erros||0)} className="w-9 text-center bg-transparent py-1 text-emerald-400 outline-none font-mono" />
                                                 <div className="w-px bg-slate-200 h-3 self-center"></div>
                                                 <input type="number" placeholder="Er." value={topico.erros ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, undefined, topico.acertos||0, parseInt(e.target.value)||0)} className="w-9 text-center bg-transparent py-1 text-rose-400 outline-none font-mono" />
                                              </div>
                                           </div>

                                           <div className="col-span-1 text-center font-mono text-[10px] text-slate-500">
                                              <button onClick={() => setHistoryModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id })} className="hover:text-blue-800 transition-colors uppercase">
                                                 {topico.data_estudo ? format(new Date(topico.data_estudo), "dd/MM") : "—"}
                                              </button>
                                           </div>

                                           <div className="col-span-2 text-center font-mono text-[10px]">
                                              {nextRevT ? (
                                                <button onClick={() => setHistoryModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id })} className={isDelayedT ? 'text-rose-400 hover:opacity-75' : isDueTodayT ? 'text-amber-400 hover:opacity-75' : 'text-blue-800 underline decoration-blue-800/30 hover:opacity-75'}>
                                                  {format(new Date(nextRevT), "dd/MM")}
                                                </button>
                                              ) : <span className="text-slate-700">—</span>}
                                           </div>

                                           <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                              <button onClick={() => setNotesModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, currentNote: topico.notas || '', title: topico.titulo })} className="p-1 text-slate-500 hover:text-amber-400"><StickyNote className="w-3 h-3" /></button>
                                              <button onClick={() => addItem(edital.id, area.id, materia.id, topico.id)} className="p-1 text-slate-500 hover:text-blue-800"><Plus className="w-3 h-3" /></button>
                                              <button onClick={() => confirm("Excluir tópico?") && deleteItem(edital.id, area.id, materia.id, topico.id, 'topico')} className="p-1 text-slate-500 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                                           </div>
                                        </div>
                                      )}

                                      {topico.subtopicos.length > 0 && (
                                        <div className="bg-white">
                                           {vSubs.map(sub => {
                                              const nextRSub = getNextRevision(sub.revisoes_agendadas);
                                              const isDelayedS = nextRSub && isPast(nextRSub) && !isToday(nextRSub);
                                              const isDueTodayS = nextRSub && isToday(nextRSub);

                                              return (
                                                <div key={sub.id} className={`grid lg:grid-cols-12 border-b border-slate-200 py-3 px-8 items-center bg-slate-50/10 group/sub transition-colors ${sub.visto ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                                                   <div className="col-span-6 flex items-center gap-4 pl-6">
                                                      <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
                                                      <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                                                        <input type="checkbox" checked={sub.visto} className="peer sr-only" onChange={() => toggleVisto(edital.id, area.id, materia.id, topico.id, sub.id)} />
                                                        <div className="w-3.5 h-3.5 border border-slate-300 rounded peer-checked:bg-blue-900 peer-checked:border-blue-900 transition-all flex items-center justify-center">
                                                           <CheckCircle2 className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                        </div>
                                                      </label>
                                                      <div className={`text-[11px] flex-1 ${sub.visto ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                                                        {editingItemId === sub.id ? (
                                                          <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, topico.id, 'subtopico', sub.id)} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, topico.id, 'subtopico', sub.id)} className="bg-transparent text-slate-900 w-full outline-none" />
                                                        ) : (
                                                          <span onDoubleClick={() => handleEdit(sub.id, sub.titulo)} className="cursor-text">{sub.titulo}</span>
                                                        )}
                                                      </div>
                                                   </div>

                                                   <div className="col-span-2 flex justify-center">
                                                      <div className="flex bg-white border border-slate-200 rounded text-[9px] opacity-70">
                                                         <input type="number" placeholder="Ac." value={sub.acertos ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, sub.id, parseInt(e.target.value)||0, sub.erros||0)} className="w-8 text-center bg-transparent py-0.5 text-emerald-400/80 outline-none font-mono" />
                                                         <input type="number" placeholder="Er." value={sub.erros ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, sub.id, sub.acertos||0, parseInt(e.target.value)||0)} className="w-8 text-center bg-transparent py-0.5 text-rose-400/80 outline-none font-mono" />
                                                      </div>
                                                   </div>

                                                   <div className="col-span-1 text-center font-mono text-[9px] text-slate-400">
                                                      <button onClick={() => setHistoryModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, subtopicoId: sub.id })} className="hover:text-blue-800">
                                                         {sub.data_estudo ? format(new Date(sub.data_estudo), "dd/MM") : "—"}
                                                      </button>
                                                   </div>

                                                   <div className="col-span-2 text-center font-mono text-[9px]">
                                                      {nextRSub ? (
                                                        <button onClick={() => setHistoryModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, subtopicoId: sub.id })} className={`hover:opacity-75 ${isDelayedS ? 'text-rose-400/70' : isDueTodayS ? 'text-amber-400/70' : 'text-blue-800/70'}`}>
                                                          {format(new Date(nextRSub), "dd/MM")}
                                                        </button>
                                                      ) : <span className="text-slate-800">—</span>}
                                                   </div>

                                                   <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                                      <button onClick={() => setNotesModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, subtopicoId: sub.id, currentNote: sub.notas || '', title: sub.titulo })} className="p-1 text-slate-400 hover:text-amber-400"><StickyNote className="w-3 h-3" /></button>
                                                      <button onClick={() => confirm("Excluir subtópico?") && deleteItem(edital.id, area.id, materia.id, sub.id, 'subtopico', topico.id)} className="p-1 text-slate-400 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                                                   </div>
                                                </div>
                                              );
                                           })}
                                        </div>
                                      )}
                                   </div>
                                 );
                               })}
                            </div>
                          )}
                       </div>
                     );
                   })}
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
      </div>

      {/* Modals */}
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
             <div className="p-4">
                <textarea 
                  autoFocus
                  placeholder="Escreva seus mnemônicos, gatilhos mentais ou resumos técnicos aqui..."
                  className="w-full h-80 p-5 outline-none resize-none text-[13px] text-slate-800 bg-white rounded-2xl border border-slate-200 focus:border-blue-900/30 transition-all placeholder:text-slate-700"
                  value={notesModal.currentNote}
                  onChange={(e) => setNotesModal({ ...notesModal, currentNote: e.target.value })}
                />
             </div>
             <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-white">
                <button onClick={() => setNotesModal(null)} className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">Cancelar</button>
                <button onClick={() => { updateNota(edital.id, notesModal.areaId, notesModal.materiaId, notesModal.topicoId, notesModal.subtopicoId, notesModal.currentNote); setNotesModal(null); }} className="px-6 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-lg shadow-blue-900/20 transition-all uppercase tracking-widest">Salvar Nota</button>
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
                               setStudyDate(edital.id, historyModal.areaId, historyModal.materiaId, historyModal.topicoId, historyModal.subtopicoId, dateStr);
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
                             addCustomRevisionDate(edital.id, historyModal.areaId, historyModal.materiaId, historyModal.topicoId, historyModal.subtopicoId, new Date(e.target.value + 'T12:00:00').toISOString());
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
                                                   removeRevisionDate(edital.id, historyModal.areaId, historyModal.materiaId, historyModal.topicoId, historyModal.subtopicoId, dateItem.raw);
                                                   addCustomRevisionDate(edital.id, historyModal.areaId, historyModal.materiaId, historyModal.topicoId, historyModal.subtopicoId, newDateStr);
                                                }
                                             }}
                                          />
                                         <div className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest px-1">{isP ? 'Atrasada' : isT ? 'Hoje' : 'Agendada'}</div>
                                      </div>
                                   </div>
                                   <button 
                                     onClick={() => removeRevisionDate(edital.id, historyModal.areaId, historyModal.materiaId, historyModal.topicoId, historyModal.subtopicoId, dateItem.raw)} 
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
    </div>
  );
}
