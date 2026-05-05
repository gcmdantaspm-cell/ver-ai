import React, { useState } from "react";
import { useEdital } from "../store";
import { format, isFuture, isPast, isToday, parseISO } from "date-fns";
import { Edital } from "../types";
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, CalendarIcon, StickyNote, X, History, CheckCircle2, ListTodo, FileText, Bell, BookOpen, Search, CornerDownRight } from "lucide-react";

export function EditalView({ edital }: { edital: Edital, key?: string | number }) {
  const { deleteEdital, toggleVisto, updateItemTitle, deleteItem, addItem, setNextRevisionDate, addCustomRevisionDate, removeRevisionDate, setStudyDate, updateNota, updateMetricas, revisions } = useEdital();
  const [expandedMaterias, setExpandedMaterias] = useState<string[]>(() => {
    // Expand the first materia by default
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

  const saveEdit = (areaId: string, materiaId: string, topicoId: string, type: 'area'|'materia'|'topico'|'subtopico') => {
    if (editingItemId && editValue.trim()) {
      updateItemTitle(edital.id, areaId, materiaId, editingItemId, editValue, type);
    }
    setEditingItemId(null);
  };

  const toggleMateria = (id: string) => setExpandedMaterias(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const getNextRevision = (dates: string[]) => {
    if (!dates || dates.length === 0) return null;
    const sorted = dates.map(d => new Date(d)).sort((a,b) => a.getTime() - b.getTime());
    return sorted.length > 0 ? sorted[0] : null;
  };

  // Calculate overall stats
  let totalItems = 0;
  let completedItems = 0;

  edital.areas.forEach(a => {
    a.materias.forEach(m => {
      m.topicos.forEach(t => {
        totalItems++;
        if (t.visto) completedItems++;
        t.subtopicos.forEach(s => {
          totalItems++;
          if (s.visto) completedItems++;
        });
      });
    });
  });

  const progressPercent = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  let historyItemInfo = null;
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

  // Gather Notes
  const allNotes: {area: string, materia: string, topico: string, subtopico?: string, notas: string, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string}[] = [];
  edital.areas.forEach(a => {
    a.materias.forEach(m => {
      m.topicos.forEach(t => {
        if (t.notas) allNotes.push({ area: a.area, materia: m.nome, topico: t.titulo, notas: t.notas, areaId: a.id, materiaId: m.id, topicoId: t.id });
        t.subtopicos.forEach(s => {
          if (s.notas) allNotes.push({ area: a.area, materia: m.nome, topico: t.titulo, subtopico: s.titulo, notas: s.notas, areaId: a.id, materiaId: m.id, topicoId: t.id, subtopicoId: s.id });
        })
      })
    })
  });

  const editalRevisions = revisions.filter(r => r.editalId === edital.id);
  const notasCounter = allNotes.length;
  const revisoesCounter = editalRevisions.length;

  return (
    <>
      <div className="flex-1 flex flex-col h-full bg-[#0B1120]">
        <header className="h-24 px-8 flex items-end pb-4 shrink-0 border-b border-slate-800/50">
          <div className="flex flex-col flex-1">
            <h2 className="text-2xl font-display font-bold text-white leading-tight">{edital.titulo}</h2>
            <p className="text-sm text-slate-400 font-medium">Verticalização e Gestão de Performance</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => deleteEdital(edital.id)} className="bg-slate-800 text-rose-400 border border-slate-700 text-xs font-bold px-4 py-2 rounded-xl uppercase tracking-wider hover:bg-rose-950/30 hover:border-rose-900 hover:text-rose-300 transition-colors shadow-sm hidden md:block">
              Excluir Edital
            </button>
          </div>
        </header>
      
      <div className="flex-1 px-4 sm:px-8 pb-20 md:pb-8 overflow-hidden flex flex-col max-w-7xl mx-auto w-full">
         <div className="hidden md:flex bg-[#111827] p-1.5 rounded-2xl mb-6 self-start space-x-1 border border-slate-800 shadow-inner">
            <button onClick={() => setActiveTab('topicos')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'topicos' ? 'bg-slate-800 text-indigo-400 shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
               <ListTodo className="w-4 h-4"/> Tópicos
            </button>
            <button onClick={() => setActiveTab('revisoes')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'revisoes' ? 'bg-slate-800 text-indigo-400 shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
               <History className="w-4 h-4"/> Revisões
               {revisoesCounter > 0 && <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md text-[10px] ml-1">{revisoesCounter}</span>}
            </button>
            <button onClick={() => setActiveTab('notas')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'notas' ? 'bg-slate-800 text-indigo-400 shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
               <FileText className="w-4 h-4"/> Anotações
               {notasCounter > 0 && <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md text-[10px] ml-1">{notasCounter}</span>}
            </button>
         </div>

         {/* Specific Active Tab Container */}
         {activeTab === 'topicos' && (
           <>
             {/* Stats and Filters Bar */}
             <div className="bg-[#111827] border text-center sm:text-left border-slate-800 rounded-t-3xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 shrink-0 shadow-sm z-20 relative">
                <div className="flex-1 w-full sm:max-w-md">
                   <div className="flex justify-between items-center mb-3 text-slate-300">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Progresso Geral</span>
                      <span className="text-lg font-display font-bold text-indigo-400">{progressPercent}%</span>
                   </div>
                   <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden mb-2 shadow-inner">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-in-out" style={{ width: `${progressPercent}%` }}></div>
                   </div>
                   <div className="text-[11px] text-slate-500 font-medium">{completedItems} de {totalItems} tópicos concluídos</div>
                </div>

                <div className="flex bg-[#0B1120] border border-slate-800 rounded-xl p-1.5 text-xs font-bold w-full sm:w-auto overflow-x-auto shadow-inner">
                   <button onClick={() => setFilter('all')} className={`flex-1 sm:flex-none px-5 py-2 rounded-lg transition-all ${filter==='all' ? 'bg-slate-800 text-indigo-400 shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-300 whitespace-nowrap'}`}>Tudo</button>
                   <button onClick={() => setFilter('pending')} className={`flex-1 sm:flex-none px-5 py-2 rounded-lg transition-all ${filter==='pending' ? 'bg-slate-800 text-indigo-400 shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-300 whitespace-nowrap'}`}>Pendentes</button>
                   <button onClick={() => setFilter('completed')} className={`flex-1 sm:flex-none px-5 py-2 rounded-lg transition-all ${filter==='completed' ? 'bg-slate-800 text-indigo-400 shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-300 whitespace-nowrap'}`}>Concluídos</button>
                   <div className="w-px bg-slate-800 mx-2 my-1"></div>
                   <button onClick={() => addItem(edital.id)} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1 shadow-sm whitespace-nowrap"><Plus className="w-4 h-4"/> Área</button>
                </div>
             </div>

             {/* Content Grid */}
             <div className="bg-[#111827] border-x border-b border-slate-800 rounded-b-3xl shadow-sm flex flex-col h-full z-10 flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-col h-full overflow-hidden">
                <div className="hidden lg:grid grid-cols-12 bg-[#111827] border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest py-4 px-6 shrink-0">
                  <div className="col-span-5 pl-8">Tópico / Subtópico</div>
                  <div className="col-span-2 text-center" title="Desempenho em Questões (Banca)">Desempenho (Ac. / Er.)</div>
                  <div className="col-span-2 text-center" title="Data em que você estudou o assunto">Visto Em</div>
                  <div className="col-span-2 text-center text-indigo-400 bg-indigo-600/10 rounded-lg py-1 border border-indigo-500/20" title="Próxima data calculada pelo algoritmo">Próx. Revisão</div>
                  <div className="col-span-1 text-right">Ações</div>
                </div>

                <div className="flex-1 overflow-y-auto pt-2 pb-12">
                   {edital.areas.map((area) => (
                     <div key={area.id} className="mb-6 mx-2">
                   <div className="px-6 py-4 bg-slate-50 rounded-2xl mx-4 mb-2 text-xs font-bold text-slate-800 uppercase tracking-widest flex justify-between items-center group shadow-sm border border-slate-100/50">
                      {editingItemId === area.id ? (
                        <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, '', '', 'area')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, '', '', 'area')} className="bg-white text-slate-800 px-3 py-1.5 rounded-lg outline-none border border-indigo-300 w-1/2 shadow-sm" />
                      ) : (
                        <span onDoubleClick={() => handleEdit(area.id, area.area)} className="tracking-widest">{area.area}</span>
                      )}
                      
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => addItem(edital.id, area.id)} className="text-blue-300 hover:text-white" title="Add Matéria"><Plus className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleEdit(area.id, area.area)} className="text-slate-400 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteItem(edital.id, area.id, '', '', 'area')} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                   </div>
                   
                   {area.materias.map((materia) => {
                     const isExpanded = expandedMaterias.includes(materia.id);
                     
                     // Calculate Materia Progress
                     let matTotal = 0; let matDone = 0;
                     materia.topicos.forEach(t => { matTotal++; if(t.visto) matDone++; t.subtopicos.forEach(s => { matTotal++; if(s.visto) matDone++; }) });
                     const matProgress = matTotal === 0 ? 0 : Math.round((matDone / matTotal) * 100);

                     // Check if materia has any visible content based on filter
                     const hasVisibleContent = materia.topicos.some(t => {
                        const matchT = filter === 'all' || (filter === 'completed' && t.visto) || (filter === 'pending' && !t.visto);
                        const matchS = t.subtopicos.some(s => filter === 'all' || (filter === 'completed' && s.visto) || (filter === 'pending' && !s.visto));
                        return matchT || matchS;
                     });

                     if (!hasVisibleContent && filter !== 'all') return null;

                     return (
                       <div key={materia.id} className="border-b border-slate-100 last:border-b-0">
                          {/* A                           <div className={`w-full px-6 py-3 bg-[#111827] hover:bg-[#1E293B] border-b border-slate-800/80 sticky top-top-9 z-10 flex items-center justify-between transition-colors group`}>
                             <button onClick={() => toggleMateria(materia.id)} className="flex items-center gap-3 flex-1 text-xs font-bold text-slate-300 uppercase tracking-widest text-left">
                                <div className={`flex items-center justify-center w-5 h-5 rounded-md transition-colors ${isExpanded ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                   {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </div>
                                {editingItemId === materia.id ? (
                                  <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, '', 'materia')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, '', 'materia')} onClick={e => e.stopPropagation()} className="font-mono bg-[#0B1120] text-white px-3 py-1 rounded-lg outline-none border border-indigo-500/50 w-1/2 shadow-sm" />
                                ) : (
                                  <span onDoubleClick={(e) => { e.stopPropagation(); handleEdit(materia.id, materia.nome); }} className="tracking-wide">{materia.nome}</span>
                                )}
                             </button>
                             <div className="flex items-center justify-end gap-3 w-48 shrink-0">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 mr-2">
                                  <button onClick={() => addItem(edital.id, area.id, materia.id)} className="text-indigo-400 hover:text-indigo-300" title="Add Tópico"><Plus className="w-4 h-4" /></button>
                                  <button onClick={() => handleEdit(materia.id, materia.nome)} className="text-slate-500 hover:text-slate-300"><Edit2 className="w-4 h-4" /></button>
                                  <button onClick={() => deleteItem(edital.id, area.id, materia.id, materia.id, 'materia')} className="text-rose-500 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 tabular-nums">{matDone}/{matTotal}</span>
                                <div className="w-16 h-1.5 bg-slate-800 rounded-full hidden sm:block overflow-hidden shrink-0 border border-slate-700">
                                   <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${matProgress}%` }}></div>
                                </div>
                             </div>
                          </div>               </div>

                          {/* Accordion Content */}
                          {isExpanded && (
                            <div className="bg-white">
                              {materia.topicos.map(topico => {
                                 const matchFilter = filter === 'all' || (filter === 'completed' && topico.visto) || (filter === 'pending' && !topico.visto);
                                 const visibleSubs = topico.subtopicos.filter(sub => filter === 'all' || (filter === 'completed' && sub.visto) || (filter === 'pending' && !sub.visto));
                                 
                                 if (!matchFilter && visibleSubs.length === 0) return null;

                                 const nextRevTopico = getNextRevision(topico.revisoes_agendadas);
                                 const isDelayedTopico = nextRevTopico && (isPast(nextRevTopico) && !isToday(nextRevTopico));
                                 const isDueTodayTopico = nextRevTopico && isToday(nextRevTopico);

                                 return (
                                   <div key={topico.id}>
                                      {matchFilter && (
                                        <div className={`flex flex-col lg:grid lg:grid-cols-12 border-b py-3 px-4 lg:px-6 items-start lg:items-center group transition-colors ${topico.visto ? 'opacity-50 bg-[#0B1120] border-slate-800' : isDelayedTopico ? 'bg-rose-500/10 border-rose-500/20' : isDueTodayTopico ? 'bg-amber-500/10 border-amber-500/20' : 'hover:bg-[#1E293B] border-slate-800'}`}>
                                            <div className="flex items-start lg:items-center gap-3 w-full lg:col-span-5">
                                              <label className="relative flex items-center justify-center cursor-pointer mt-0.5 lg:mt-0 shrink-0">
                                                <input 
                                                  type="checkbox" 
                                                  checked={topico.visto} 
                                                  className="peer sr-only" 
                                                  onChange={() => toggleVisto(edital.id, area.id, materia.id, topico.id)}
                                                />
                                                <div className="w-5 h-5 border-2 border-slate-600 rounded-md peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                                                   <CheckCircle2 className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                </div>
                                              </label>
                                              <div className={`font-sans font-medium text-sm truncate pr-2 w-full ${topico.visto ? 'text-slate-500 line-through' : 'text-white'}`}>
                                                {editingItemId === topico.id ? (
                                                  <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, topico.id, 'topico')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, topico.id, 'topico')} className="font-mono bg-[#0B1120] text-white px-3 leading-tight py-1 rounded-lg outline-none border border-indigo-500/50 w-full shadow-sm" />
                                                ) : (
                                                  <span onDoubleClick={() => handleEdit(topico.id, topico.titulo)}>{topico.titulo}</span>
                                                )}
                                              </div>
                                            </div>

                                            <div className="mt-3 lg:mt-0 pl-8 lg:pl-0 w-full lg:col-span-7 grid grid-cols-2 lg:grid-cols-7 gap-3 lg:gap-0 items-center">
                                              
                                              <div className="col-span-2 flex items-center justify-start lg:justify-center gap-2">
                                                 <div className="flex items-center bg-[#0B1120] border border-slate-700/50 rounded-lg overflow-hidden shrink-0 shadow-inner">
                                                    <input type="number" placeholder="Ac." min="0" value={topico.acertos ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, undefined, parseInt(e.target.value)||0, topico.erros||0)} className="w-10 bg-transparent text-center text-xs text-emerald-400 py-1.5 outline-none font-mono placeholder:text-slate-600" title="Acertos" />
                                                    <div className="w-px bg-slate-700/50 h-full"></div>
                                                    <input type="number" placeholder="Er." min="0" value={topico.erros ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, undefined, topico.acertos||0, parseInt(e.target.value)||0)} className="w-10 bg-transparent text-center text-xs text-rose-400 py-1.5 outline-none font-mono placeholder:text-slate-600" title="Erros" />
                                                 </div>
                                                 {topico.acertos !== undefined && (topico.acertos > 0 || (topico.erros && topico.erros > 0)) && (
                                                    <div className={`text-[10px] font-bold ${topico.acertos - (topico.erros||0) > 0 ? 'text-emerald-400' : 'text-rose-400'}`} title="Rendimento Líquido (Cebraspe)">
                                                      {topico.acertos - (topico.erros||0) > 0 ? '+' : ''}{topico.acertos - (topico.erros||0)}
                                                    </div>
                                                 )}
                                              </div>

                                              <div className="col-span-1 lg:col-span-2 text-slate-500 relative flex justify-start lg:justify-center items-center group/date flex-col lg:flex-row gap-1">
                                                <span className="text-[9px] uppercase font-bold text-slate-600 lg:hidden self-start tracking-wider">Visto Em</span>
                                                <div className="border border-transparent hover:border-slate-700 rounded-lg px-2 py-1 flex gap-1.5 items-center transition-colors font-mono text-xs">
                                                  <span>{topico.data_estudo ? format(new Date(topico.data_estudo), "dd/MM/yyyy") : "—"}</span>
                                                  <CalendarIcon className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover/date:opacity-100" />
                                                </div>
                                                <input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => setStudyDate(edital.id, area.id, materia.id, topico.id, undefined, e.target.value)} />
                                              </div>
                                              
                                              <div className={`col-span-1 lg:col-span-2 font-mono text-xs relative flex justify-start lg:justify-center items-center group/rev flex-col lg:flex-row gap-1 ${isDelayedTopico ? 'text-rose-400 font-bold' : isDueTodayTopico ? 'text-amber-400 font-bold' : 'text-indigo-400 font-medium'}`}>
                                                <span className="text-[9px] uppercase font-bold text-slate-600 lg:hidden self-start tracking-wider">Próx. Revisão</span>
                                                <div className="border border-transparent hover:border-slate-700 rounded-lg px-2 py-1 flex gap-1.5 items-center transition-colors">
                                                  <span>{nextRevTopico ? format(nextRevTopico, "dd/MM/yyyy") : "—"}</span>
                                                  <CalendarIcon className="w-3.5 h-3.5 opacity-0 group-hover/rev:opacity-100" />
                                                </div>
                                                <input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => setNextRevisionDate(edital.id, area.id, materia.id, topico.id, undefined, e.target.value)} />
                                              </div>

                                              <div className="col-span-2 lg:col-span-1 text-right flex justify-between lg:justify-end gap-2 items-center w-full mt-2 lg:mt-0">
                                                <div className="flex opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-3 align-middle">
                                                  <button onClick={() => setHistoryModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id })} className="text-slate-500 hover:text-indigo-400" title="Histórico"><History className="w-4 h-4 p-0.5" /></button>
                                                  <button onClick={() => setNotesModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, currentNote: topico.notas || '', title: topico.titulo })} className={`${topico.notas ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-amber-400'}`} title="Anotações"><StickyNote className="w-4 h-4 p-0.5" /></button>
                                                  <button onClick={() => addItem(edital.id, area.id, materia.id, topico.id)} className="text-indigo-500 hover:text-indigo-400" title="Add Subtópico"><Plus className="w-4 h-4 p-0.5" /></button>
                                                  <button onClick={() => handleEdit(topico.id, topico.titulo)} className="text-slate-500 hover:text-slate-300"><Edit2 className="w-4 h-4 p-0.5" /></button>
                                                  <button onClick={() => deleteItem(edital.id, area.id, materia.id, topico.id, 'topico')} className="text-rose-500 hover:text-rose-400"><Trash2 className="w-4 h-4 p-0.5" /></button>
                                                </div>
                                              </div>
                                            </div>
                                        </div>
                                      )}

                                      {/* Subtopics with Indentation */}
                                      {visibleSubs.map(sub => {
                                        const nextRevSub = getNextRevision(sub.revisoes_agendadas);
                                        const isDelayedSub = nextRevSub && (isPast(nextRevSub) && !isToday(nextRevSub));
                                        const isDueTodaySub = nextRevSub && isToday(nextRevSub);
                                        
                                        return (
                                          <div key={sub.id} className={`flex flex-col lg:grid lg:grid-cols-12 border-b py-2 px-4 lg:px-6 items-start lg:items-center group transition-colors ${sub.visto ? 'opacity-40 bg-[#0B1120] border-slate-800' : isDelayedSub ? 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/10' : isDueTodaySub ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10' : 'bg-[#0f172a]/20 hover:bg-[#1E293B] border-slate-800'}`}>
                                            <div className="flex items-start lg:items-center gap-3 w-full lg:col-span-5 pl-2 lg:pl-4">
                                              <CornerDownRight className="w-4 h-4 text-slate-600 shrink-0 hidden lg:block" />
                                              <label className="relative flex items-center justify-center cursor-pointer mt-0.5 lg:mt-0 shrink-0">
                                                <input 
                                                  type="checkbox" 
                                                  checked={sub.visto} 
                                                  className="peer sr-only" 
                                                  onChange={() => toggleVisto(edital.id, area.id, materia.id, topico.id, sub.id)}
                                                />
                                                <div className="w-5 h-5 border-2 border-slate-600 rounded-md peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                                                   <CheckCircle2 className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                </div>
                                              </label>
                                              <div className={`font-sans text-[13px] truncate pr-2 w-full ${sub.visto ? 'text-slate-500 line-through' : 'text-slate-400'}`}>
                                                {editingItemId === sub.id ? (
                                                  <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, topico.id, 'subtopico')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, topico.id, 'subtopico')} className="font-mono bg-[#0B1120] text-white px-3 leading-tight py-1 rounded-lg outline-none border border-indigo-500/50 w-full shadow-sm" />
                                                ) : (
                                                  <span onDoubleClick={() => handleEdit(sub.id, sub.titulo)}>{sub.titulo}</span>
                                                )}
                                              </div>
                                            </div>
                                            
                                            <div className="mt-2 lg:mt-0 pl-12 lg:pl-0 w-full lg:col-span-7 grid grid-cols-2 lg:grid-cols-7 gap-3 lg:gap-0 items-center">
                                              
                                              <div className="col-span-2 flex items-center justify-start lg:justify-center gap-2">
                                                 <div className="flex items-center bg-[#0B1120] border border-slate-700/50 rounded-lg overflow-hidden shrink-0 shadow-inner">
                                                    <input type="number" placeholder="Ac." min="0" value={sub.acertos ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, sub.id, parseInt(e.target.value)||0, sub.erros||0)} className="w-10 bg-transparent text-center text-xs text-emerald-400 py-1.5 outline-none font-mono placeholder:text-slate-600" title="Acertos" />
                                                    <div className="w-px bg-slate-700/50 h-full"></div>
                                                    <input type="number" placeholder="Er." min="0" value={sub.erros ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, sub.id, sub.acertos||0, parseInt(e.target.value)||0)} className="w-10 bg-transparent text-center text-xs text-rose-400 py-1.5 outline-none font-mono placeholder:text-slate-600" title="Erros" />
                                                 </div>
                                                 {sub.acertos !== undefined && (sub.acertos > 0 || (sub.erros && sub.erros > 0)) && (
                                                    <div className={`text-[10px] font-bold ${sub.acertos - (sub.erros||0) > 0 ? 'text-emerald-400' : 'text-rose-400'}`} title="Rendimento Líquido (Cebraspe)">
                                                      {sub.acertos - (sub.erros||0) > 0 ? '+' : ''}{sub.acertos - (sub.erros||0)}
                                                    </div>
                                                 )}
                                              </div>

                                              <div className="col-span-1 lg:col-span-2 text-slate-500 relative flex justify-start lg:justify-center items-center group/date flex-col lg:flex-row gap-1">
                                                <span className="text-[9px] uppercase font-bold text-slate-600 lg:hidden self-start tracking-wider">Visto Em</span>
                                                <div className="border border-transparent hover:border-slate-700 rounded-lg px-2 py-0.5 flex gap-1.5 items-center transition-colors font-mono text-[11px]">
                                                  <span>{sub.data_estudo ? format(new Date(sub.data_estudo), "dd/MM/yyyy") : "—"}</span>
                                                  <CalendarIcon className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover/date:opacity-100" />
                                                </div>
                                                <input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => setStudyDate(edital.id, area.id, materia.id, topico.id, sub.id, e.target.value)} />
                                              </div>
                                              
                                              <div className={`col-span-1 lg:col-span-2 font-mono text-[11px] relative flex justify-start lg:justify-center items-center group/rev flex-col lg:flex-row gap-1 ${isDelayedSub ? 'text-rose-400 font-bold' : isDueTodaySub ? 'text-amber-400 font-bold' : 'text-indigo-400 font-medium'}`}>
                                                <span className="text-[9px] uppercase font-bold text-slate-600 lg:hidden self-start tracking-wider">Próx. Revisão</span>
                                                <div className="border border-transparent hover:border-slate-700 rounded-lg px-2 py-0.5 flex gap-1.5 items-center transition-colors">
                                                  <span>{nextRevSub ? format(nextRevSub, "dd/MM/yyyy") : "—"}</span>
                                                  <CalendarIcon className="w-3.5 h-3.5 opacity-0 group-hover/rev:opacity-100" />
                                                </div>
                                                <input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => setNextRevisionDate(edital.id, area.id, materia.id, topico.id, sub.id, e.target.value)} />
                                              </div>

                                              <div className="col-span-2 lg:col-span-1 text-right flex justify-between lg:justify-end gap-2 items-center w-full mt-2 lg:mt-0">
                                                <div className="flex opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-3 align-middle">
                                                  <button onClick={() => setHistoryModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, subtopicoId: sub.id })} className="text-slate-500 hover:text-indigo-400" title="Histórico"><History className="w-3.5 h-3.5 p-0.5" /></button>
                                                  <button onClick={() => setNotesModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, subtopicoId: sub.id, currentNote: sub.notas || '', title: sub.titulo })} className={`${sub.notas ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-amber-400'}`} title="Anotações"><StickyNote className="w-3.5 h-3.5 p-0.5" /></button>
                                                  <button onClick={() => handleEdit(sub.id, sub.titulo)} className="text-slate-500 hover:text-slate-300"><Edit2 className="w-3.5 h-3.5 p-0.5" /></button>
                                                  <button onClick={() => deleteItem(edital.id, area.id, materia.id, sub.id, 'subtopico', topico.id)} className="text-rose-500 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5 p-0.5" /></button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                   </div>
                                 );
                               })}
                            </div>
                          )}
                       </div>
                     )
                   })}
                 </div>
               ))}
               {edital.areas.length === 0 && (
                  <div className="p-12 text-center text-slate-400">
                     Nenhuma área de conhecimento encontrada neste edital.
                  </div>
               )}
            </div>
             </div>
            </div>
           </>
         )}

         {activeTab === 'revisoes' && (
           <div className="bg-white border border-slate-100/50 rounded-3xl shadow-sm flex flex-col h-full z-10 flex-1 min-h-0 overflow-hidden mt-6 mb-6">
              <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-3xl text-center md:text-left">
                  <h3 className="text-lg font-display font-bold text-slate-800">Revisões Programadas</h3>
                  <p className="text-sm text-slate-500 font-medium">Assuntos que precisam ser revisitados neste edital.</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
                 {editalRevisions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                       <CheckCircle2 className="w-12 h-12 mb-4 text-slate-200" />
                       <p>Nenhuma revisão pendente para este edital.</p>
                    </div>
                 ) : (
                    editalRevisions.map((rev, i) => (
                       <div key={i} className={`p-4 md:p-5 rounded-2xl border ${rev.atrasada ? 'bg-rose-50/50 border-rose-100' : isToday(new Date(rev.dataRevisao)) ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100 shadow-sm'}`}>
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                             <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                   <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${rev.atrasada ? 'bg-rose-100 text-rose-600' : isToday(new Date(rev.dataRevisao)) ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-500'}`}>
                                      {rev.materiaNome}
                                   </span>
                                </div>
                                <h4 className="font-bold text-slate-800">{rev.tituloItem}</h4>
                                <p className="text-xs text-slate-500 font-medium mt-1">{rev.areaNome}</p>
                             </div>
                             <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                                <div className={`text-sm font-bold ${rev.atrasada ? 'text-rose-600' : isToday(new Date(rev.dataRevisao)) ? 'text-amber-600' : 'text-slate-600'}`}>
                                   {format(new Date(rev.dataRevisao), "dd 'de' MMM, yyyy")}
                                </div>
                                <div className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
                                   {rev.atrasada ? `${rev.diasAtraso} ${rev.diasAtraso === 1 ? 'dia' : 'dias'} de atraso` : isToday(new Date(rev.dataRevisao)) ? 'Agendado para hoje' : 'Próxima Revisão'}
                                </div>
                             </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-100/50 flex justify-end">
                             <button onClick={() => setHistoryModal({ isOpen: true, areaId: rev.areaId, materiaId: rev.materiaId, topicoId: rev.topicoOuSubId })} className="text-indigo-600 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                                <History className="w-3.5 h-3.5"/> Abrir Histórico
                             </button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
         )}

         {activeTab === 'notas' && (
           <div className="bg-white border border-slate-100/50 rounded-3xl shadow-sm flex flex-col h-full z-10 flex-1 min-h-0 overflow-hidden mt-6 mb-6">
              <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-3xl text-center md:text-left flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-800">Suas Anotações</h3>
                    <p className="text-sm text-slate-500 font-medium">Todos os resumos e apontamentos deste edital</p>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
                 {allNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                       <FileText className="w-12 h-12 mb-4 text-slate-200" />
                       <p>Nenhuma anotação adicionada ainda.</p>
                       <p className="text-xs mt-2">Clique no ícone de "Anotações" nos tópicos para criar.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {allNotes.map((note, i) => (
                          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-full">
                             <div className="flex items-start justify-between gap-2 mb-3 border-b border-slate-100 pb-3">
                                <div>
                                   <div className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider mb-1">{note.materia}</div>
                                   <h4 className="font-bold text-slate-800 text-sm leading-tight">{note.subtopico || note.topico}</h4>
                                </div>
                                <button className="text-slate-400 hover:text-amber-500 shrink-0 p-1 bg-slate-50 rounded-md hover:bg-amber-50 transition-colors" onClick={() => setNotesModal({ isOpen: true, areaId: note.areaId, materiaId: note.materiaId, topicoId: note.topicoId, subtopicoId: note.subtopicoId, currentNote: note.notas, title: note.subtopico || note.topico })}>
                                   <Edit2 className="w-4 h-4"/>
                                </button>
                             </div>
                             <p className="text-sm text-slate-600 whitespace-pre-wrap flex-1 break-words">
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

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md shadow-2xl shadow-slate-200/50 rounded-full border border-slate-200/60 flex items-center p-1.5 z-40">
         <button onClick={() => setActiveTab('topicos')} className={`flex flex-col items-center justify-center w-20 h-14 rounded-full transition-all ${activeTab === 'topicos' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
            <ListTodo className={`w-5 h-5 ${activeTab === 'topicos' ? 'mb-0.5' : 'mb-1'}`}/>
            {activeTab === 'topicos' && <span className="text-[9px] font-bold tracking-widest uppercase">Tópicos</span>}
         </button>
         <button onClick={() => setActiveTab('revisoes')} className={`relative flex flex-col items-center justify-center w-20 h-14 rounded-full transition-all ${activeTab === 'revisoes' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
            <History className={`w-5 h-5 ${activeTab === 'revisoes' ? 'mb-0.5' : 'mb-1'}`}/>
            {revisoesCounter > 0 && <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>}
            {activeTab === 'revisoes' && <span className="text-[9px] font-bold tracking-widest uppercase">Revisões</span>}
         </button>
         <button onClick={() => setActiveTab('notas')} className={`relative flex flex-col items-center justify-center w-20 h-14 rounded-full transition-all ${activeTab === 'notas' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
            <FileText className={`w-5 h-5 ${activeTab === 'notas' ? 'mb-0.5' : 'mb-1'}`}/>
            {notasCounter > 0 && <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>}
            {activeTab === 'notas' && <span className="text-[9px] font-bold tracking-widest uppercase">Notas</span>}
         </button>
      </div>
      </div>

      {notesModal && notesModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
               <div>
                 <h3 className="text-lg font-display font-bold text-slate-800">Anotações</h3>
                 <p className="text-xs text-slate-500 mt-1 font-medium">{notesModal.title}</p>
               </div>
               <button onClick={() => setNotesModal(null)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-2">
                <textarea 
                  autoFocus
                  placeholder="Escreva seus resumos, mnemônicos ou pontos de atenção aqui..."
                  className="w-full h-64 p-4 outline-none resize-none text-sm text-slate-700 bg-transparent placeholder:text-slate-300"
                  value={notesModal.currentNote}
                  onChange={(e) => setNotesModal({ ...notesModal, currentNote: e.target.value })}
                />
             </div>
             <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                <button 
                  onClick={() => setNotesModal(null)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >Cancelar</button>
                <button 
                  onClick={() => {
                    updateNota(edital.id, notesModal.areaId, notesModal.materiaId, notesModal.topicoId, notesModal.subtopicoId, notesModal.currentNote);
                    setNotesModal(null);
                  }}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
                >Salvar Anotação</button>
             </div>
           </div>
        </div>
      )}
      {historyModal && historyModal.isOpen && historyItemInfo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
               <div>
                 <h3 className="font-display text-lg font-bold text-slate-800">Histórico</h3>
                 <p className="text-xs text-slate-500 mt-1 font-medium truncate max-w-[250px]">{historyItemInfo.titulo}</p>
               </div>
               <button onClick={() => setHistoryModal(null)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
             </div>
             
             <div className="p-6 flex flex-col gap-8 max-h-[60vh] overflow-y-auto">
                <div>
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Primeiro Estudo</h4>
                   {historyItemInfo.data_estudo ? (
                     <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                           <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div>
                           <div className="text-sm font-bold text-slate-800">{format(new Date(historyItemInfo.data_estudo), "dd 'de' MMM, yyyy")}</div>
                           <div className="text-xs text-slate-500 mt-0.5">Concluído</div>
                        </div>
                     </div>
                   ) : (
                     <div className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">Tema ainda não estudado.</div>
                   )}
                </div>

                <div>
                   <div className="flex items-center justify-between mb-4">
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fila de Revisões</h4>
                     <label className="text-indigo-600 hover:text-indigo-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-indigo-50 px-2 py-1 rounded-md transition-colors">
                        <Plus className="w-3 h-3" /> Adicionar
                        <input type="date" className="hidden" onChange={(e) => {
                          if(e.target.value) {
                             addCustomRevisionDate(edital.id, historyModal.areaId, historyModal.materiaId, historyModal.topicoId, historyModal.subtopicoId, new Date(e.target.value + 'T12:00:00').toISOString());
                          }
                        }} />
                     </label>
                   </div>
                   
                   {historyItemInfo.revisoes_agendadas && historyItemInfo.revisoes_agendadas.length > 0 ? (
                      <div className="flex flex-col gap-3">
                         {historyItemInfo.revisoes_agendadas
                            .map(d => ({ raw: d, obj: new Date(d) }))
                            .sort((a,b) => a.obj.getTime() - b.obj.getTime())
                            .map((dateItem, idx) => {
                               const date = dateItem.obj;
                               const isPastDate = isPast(date) && !isToday(date);
                               const isTodayDate = isToday(date);
                               return (
                                 <div key={idx} className={`flex items-center justify-between group p-3 rounded-2xl border ${isPastDate ? 'bg-rose-50/50 border-rose-100' : isTodayDate ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100 shadow-sm'}`}>
                                   <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPastDate ? 'bg-rose-100 text-rose-500' : isTodayDate ? 'bg-amber-100 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
                                         <History className="w-5 h-5" />
                                      </div>
                                      <div>
                                         <div className={`text-sm font-bold ${isPastDate ? 'text-rose-600' : isTodayDate ? 'text-amber-600' : 'text-slate-700'}`}>{format(date, "dd 'de' MMM, yyyy")}</div>
                                         <div className="text-xs text-slate-500 mt-0.5">{isPastDate ? 'Atrasada' : isTodayDate ? 'Para hoje' : 'Agendada'}</div>
                                      </div>
                                   </div>
                                   
                                   <button 
                                     onClick={() => removeRevisionDate(edital.id, historyModal.areaId, historyModal.materiaId, historyModal.topicoId, historyModal.subtopicoId, dateItem.raw)} 
                                     className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 p-2 transition-opacity bg-white rounded-full shadow-sm" title="Remover Revisão">
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                 </div>
                               )
                            })}
                      </div>
                   ) : (
                      <div className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">Nenhuma revisão agendada.</div>
                   )}
                </div>
             </div>
             
             <div className="p-5 border-t border-slate-100 flex justify-end bg-slate-50/50">
                <button 
                  onClick={() => setHistoryModal(null)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-colors"
                >Fechar</button>
             </div>
           </div>
        </div>
      )}
    </>
  )
}
