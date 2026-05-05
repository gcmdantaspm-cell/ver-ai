import { useState } from "react";
import { useEdital } from "../store";
import { format, isFuture, isPast, isToday, parseISO } from "date-fns";
import { Edital } from "../types";
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, CalendarIcon, StickyNote, X, History } from "lucide-react";

export function EditalView({ edital }: { edital: Edital }) {
  const { deleteEdital, toggleVisto, updateItemTitle, deleteItem, addItem, setNextRevisionDate, setStudyDate, updateNota } = useEdital();
  const [expandedMaterias, setExpandedMaterias] = useState<string[]>(() => {
    // Expand the first materia by default
    return edital.areas[0]?.materias[0] ? [edital.areas[0].materias[0].id] : [];
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [notesModal, setNotesModal] = useState<{ isOpen: boolean, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string, currentNote: string, title: string } | null>(null);
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean, title: string, studyDate: string | null, revisionDates: string[] } | null>(null);

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

  return (
    <>
      <div className="flex-1 flex flex-col h-full bg-[#F8FAFC]">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 leading-tight">{edital.titulo}</h2>
          <p className="text-xs text-slate-500 font-mono">Verticalização Integrada // Repetição Espaçada Ativa</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => deleteEdital(edital.id)} className="bg-rose-50 text-rose-700 text-[11px] font-bold px-4 py-1.5 rounded uppercase tracking-wider border border-rose-100 hover:bg-rose-100 transition-colors">
            Excluir Edital
          </button>
        </div>
      </header>
      
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
         {/* Stats and Filters Bar */}
         <div className="bg-white border text-center sm:text-left border-slate-200 rounded-t-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 shadow-sm z-20 relative">
            <div className="flex-1 w-full sm:max-w-md">
               <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                  <span>Progresso Geral do Edital</span>
                  <span className="text-blue-600">{progressPercent}%</span>
               </div>
               <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full transition-all duration-700 ease-in-out" style={{ width: `${progressPercent}%` }}></div>
               </div>
               <div className="text-[10px] text-slate-400 mt-1.5 font-medium">{completedItems} de {totalItems} tópicos concluídos</div>
            </div>

            <div className="flex bg-slate-100 border border-slate-200 rounded p-1 text-[10px] font-bold w-full sm:w-auto overflow-x-auto">
               <button onClick={() => setFilter('all')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded transition-all ${filter==='all' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>TUDO</button>
               <button onClick={() => setFilter('pending')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded transition-all ${filter==='pending' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>PENDENTES</button>
               <button onClick={() => setFilter('completed')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded transition-all ${filter==='completed' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>CONCLUÍDOS</button>
               <button onClick={() => addItem(edital.id)} className="flex-1 sm:flex-none ml-2 px-4 py-1.5 bg-[#0B132B] text-white rounded hover:bg-[#1C2541] transition-colors flex items-center justify-center gap-1"><Plus className="w-3 h-3"/> ÁREA</button>
            </div>
         </div>

         {/* Content Grid */}
         <div className="bg-white border-x border-b border-slate-200 rounded-b-xl shadow-sm flex flex-col h-full z-10 flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-col h-full overflow-hidden">
                <div className="hidden lg:grid grid-cols-12 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3 px-6 shrink-0">
                  <div className="col-span-6 pl-8">Tópico / Subtópico</div>
                  <div className="col-span-2 text-center" title="Data em que você estudou o assunto">Visto Em</div>
                  <div className="col-span-2 text-center text-blue-600 bg-blue-50/50 rounded py-0.5" title="Próxima data calculada pelo algoritmo">Próx. Revisão</div>
                  <div className="col-span-2 text-right">Ações / Status</div>
                </div>

                <div className="flex-1 overflow-y-auto font-mono text-[11px] pb-12">
                   {edital.areas.map((area) => (
                     <div key={area.id}>
                   <div className="px-6 py-3 bg-[#0B132B] border-b border-[#1C2541] text-[10px] font-bold text-white uppercase tracking-widest sticky top-0 z-20 flex justify-between items-center group">
                      {editingItemId === area.id ? (
                        <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, '', '', 'area')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, '', '', 'area')} className="bg-[#1C2541] text-white px-2 py-1 rounded outline-none border border-blue-500 w-1/2" />
                      ) : (
                        <span onDoubleClick={() => handleEdit(area.id, area.area)}>{area.area}</span>
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
                       <div key={materia.id} className="border-b border-slate-200 last:border-b-0">
                          {/* Accordion Header */}
                          <div className={`w-full px-6 py-2 bg-slate-100/80 hover:bg-slate-200 border-b border-blue-100 sticky top-9 z-10 flex items-center justify-between transition-colors ${isExpanded ? 'shadow-sm' : ''} group`}>
                             <button onClick={() => toggleMateria(materia.id)} className="flex items-center gap-2 flex-1 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-left">
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                {editingItemId === materia.id ? (
                                  <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, '', 'materia')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, '', 'materia')} onClick={e => e.stopPropagation()} className="font-mono bg-white text-slate-800 px-2 py-1 rounded outline-none border border-blue-300 w-1/2" />
                                ) : (
                                  <span onDoubleClick={(e) => { e.stopPropagation(); handleEdit(materia.id, materia.nome); }}>{materia.nome}</span>
                                )}
                             </button>
                             <div className="flex items-center justify-end gap-3 w-48">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 mr-2">
                                  <button onClick={() => addItem(edital.id, area.id, materia.id)} className="text-blue-500 hover:text-blue-700" title="Add Tópico"><Plus className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleEdit(materia.id, materia.nome)} className="text-slate-400 hover:text-slate-600"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => deleteItem(edital.id, area.id, materia.id, materia.id, 'materia')} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                                <span className="text-[10px] text-slate-500">{matDone}/{matTotal}</span>
                                <div className="w-16 h-1.5 bg-slate-200 rounded-full hidden sm:block overflow-hidden shrink-0">
                                   <div className="h-full bg-blue-500" style={{ width: `${matProgress}%` }}></div>
                                </div>
                             </div>
                          </div>

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
                                        <div className={`flex flex-col lg:grid lg:grid-cols-12 border-b py-3 px-4 lg:px-6 items-start lg:items-center group transition-colors ${topico.visto ? 'opacity-70 bg-slate-50 border-slate-100' : isDelayedTopico ? 'bg-rose-50 border-rose-100/50 hover:bg-rose-100/50' : isDueTodayTopico ? 'bg-amber-50 border-amber-100/50 hover:bg-amber-100/50' : 'hover:bg-slate-50 border-slate-100'}`}>
                                            <div className="flex items-start lg:items-center gap-3 w-full lg:col-span-6">
                                              <input 
                                                type="checkbox" 
                                                checked={topico.visto} 
                                                onChange={() => toggleVisto(edital.id, area.id, materia.id, topico.id)}
                                                className="accent-blue-600 w-4 h-4 cursor-pointer mt-1 lg:mt-0 shrink-0" 
                                              />
                                              <div className={`font-sans font-medium text-[13px] truncate pr-2 w-full ${topico.visto ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                                {editingItemId === topico.id ? (
                                                  <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, topico.id, 'topico')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, topico.id, 'topico')} className="font-mono bg-white text-slate-800 px-2 leading-tight py-0.5 rounded outline-none border border-blue-300 w-full" />
                                                ) : (
                                                  <span onDoubleClick={() => handleEdit(topico.id, topico.titulo)}>{topico.titulo}</span>
                                                )}
                                              </div>
                                            </div>

                                            <div className="mt-3 lg:mt-0 pl-7 lg:pl-0 w-full lg:col-span-6 grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-0 items-center">
                                              <div className="col-span-1 lg:col-span-2 text-slate-500 relative flex justify-start lg:justify-center items-center group/date flex-col lg:flex-row gap-1">
                                                <span className="text-[9px] uppercase font-bold text-slate-400 lg:hidden self-start">Visto Em</span>
                                                <div className="border border-transparent border-dashed group-hover/date:border-slate-300 rounded px-2 py-0.5 flex gap-1 items-center transition-colors">
                                                  <span>{topico.data_estudo ? format(new Date(topico.data_estudo), "dd/MM/yyyy") : "—"}</span>
                                                  <CalendarIcon className="w-3 h-3 text-slate-400 opacity-0 group-hover/date:opacity-100" />
                                                </div>
                                                <input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => setStudyDate(edital.id, area.id, materia.id, topico.id, undefined, e.target.value)} />
                                              </div>
                                              
                                              <div className={`col-span-1 lg:col-span-2 font-bold relative flex justify-start lg:justify-center items-center group/rev flex-col lg:flex-row gap-1 ${isDelayedTopico ? 'text-rose-600' : isDueTodayTopico ? 'text-amber-600' : 'text-blue-500'}`}>
                                                <span className="text-[9px] uppercase font-bold text-slate-400 lg:hidden self-start">Próx. Revisão</span>
                                                <div className="border border-transparent border-dashed group-hover/rev:border-slate-300 rounded px-2 py-0.5 flex gap-1 items-center transition-colors">
                                                  <span>{nextRevTopico ? format(nextRevTopico, "dd/MM/yyyy") : "—"}</span>
                                                  <CalendarIcon className="w-3 h-3 text-slate-400 opacity-0 group-hover/rev:opacity-100" />
                                                </div>
                                                <input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => setNextRevisionDate(edital.id, area.id, materia.id, topico.id, undefined, e.target.value)} />
                                              </div>

                                              <div className="col-span-2 lg:col-span-2 text-right flex justify-between lg:justify-end gap-2 items-center w-full mt-2 lg:mt-0">
                                                <div className="flex opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-3 lg:gap-1.5 align-middle">
                                                  <button onClick={() => setHistoryModal({ isOpen: true, title: topico.titulo, studyDate: topico.data_estudo, revisionDates: topico.revisoes_agendadas })} className="text-slate-400 hover:text-blue-500" title="Histórico"><History className="w-4 h-4 lg:w-3 lg:h-3" /></button>
                                                  <button onClick={() => setNotesModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, currentNote: topico.notas || '', title: topico.titulo })} className={`${topico.notas ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-amber-500'}`} title="Anotações"><StickyNote className="w-4 h-4 lg:w-3 lg:h-3" /></button>
                                                  <button onClick={() => addItem(edital.id, area.id, materia.id, topico.id)} className="text-blue-500 hover:text-blue-700" title="Add Subtópico"><Plus className="w-4 h-4 lg:w-3 lg:h-3" /></button>
                                                  <button onClick={() => handleEdit(topico.id, topico.titulo)} className="text-slate-400 hover:text-slate-600"><Edit2 className="w-4 h-4 lg:w-3 lg:h-3" /></button>
                                                  <button onClick={() => deleteItem(edital.id, area.id, materia.id, topico.id, 'topico')} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4 lg:w-3 lg:h-3" /></button>
                                                </div>
                                                {topico.visto ? (
                                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold uppercase tracking-wider shrink-0">Concluí</span>
                                                ) : (
                                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-wider border border-slate-200 shrink-0">A Estudar</span>
                                                )}
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
                                          <div key={sub.id} className={`flex flex-col lg:grid lg:grid-cols-12 border-b py-2 px-4 lg:px-6 items-start lg:items-center group transition-colors ${sub.visto ? 'opacity-70 bg-slate-50/40 border-slate-100' : isDelayedSub ? 'bg-rose-50/50 hover:bg-rose-100/50 border-rose-100/30' : isDueTodaySub ? 'bg-amber-50/50 hover:bg-amber-100/50 border-amber-100/30' : 'bg-slate-50/40 hover:bg-blue-50/50 border-slate-100'}`}>
                                            <div className="flex items-start lg:items-center gap-3 w-full lg:col-span-6 pl-2 lg:pl-4">
                                               {/* Visual Connector / Indentation */}
                                               <div className="hidden lg:block h-6 border-l-2 border-blue-200 ml-4 mr-1 group-hover:border-blue-400 transition-colors"></div>
                                              <input 
                                                type="checkbox" 
                                                checked={sub.visto}
                                                onChange={() => toggleVisto(edital.id, area.id, materia.id, topico.id, sub.id)}
                                                className="accent-blue-500 w-3.5 h-3.5 cursor-pointer mt-1 lg:mt-0 shrink-0" 
                                              />
                                              <div className={`font-sans text-[12px] truncate pr-2 w-full ${sub.visto ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                                                {editingItemId === sub.id ? (
                                                  <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, sub.id, 'subtopico')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, sub.id, 'subtopico')} className="font-mono bg-white text-slate-800 px-2 py-0.5 rounded outline-none border border-blue-300 w-full" />
                                                ) : (
                                                  <span onDoubleClick={() => handleEdit(sub.id, sub.titulo)}>{sub.titulo}</span>
                                                )}
                                              </div>
                                            </div>

                                            <div className="mt-2 lg:mt-0 pl-10 lg:pl-0 w-full lg:col-span-6 grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-0 items-center">
                                              <div className="col-span-1 lg:col-span-2 text-slate-500 relative flex justify-start lg:justify-center items-center group/date flex-col lg:flex-row gap-1">
                                                <span className="text-[9px] uppercase font-bold text-slate-400 lg:hidden self-start">Visto Em</span>
                                                <div className="border border-transparent border-dashed group-hover/date:border-slate-300 rounded px-2 py-0.5 flex gap-1 items-center transition-colors">
                                                  <span>{sub.data_estudo ? format(new Date(sub.data_estudo), "dd/MM") : "—"}</span>
                                                  <CalendarIcon className="w-3 h-3 text-slate-400 opacity-0 group-hover/date:opacity-100" />
                                                </div>
                                                <input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => setStudyDate(edital.id, area.id, materia.id, topico.id, sub.id, e.target.value)} />
                                              </div>
                                              
                                              <div className={`col-span-1 lg:col-span-2 font-bold relative flex justify-start lg:justify-center items-center group/rev flex-col lg:flex-row gap-1 ${isDelayedSub ? 'text-rose-500' : isDueTodaySub ? 'text-amber-500' : 'text-blue-400'}`}>
                                                <span className="text-[9px] uppercase font-bold text-slate-400 lg:hidden self-start">Próx. Revisão</span>
                                                <div className="border border-transparent border-dashed group-hover/rev:border-slate-300 rounded px-2 py-0.5 flex gap-1 items-center transition-colors">
                                                  <span>{nextRevSub ? format(nextRevSub, "dd/MM") : "—"}</span>
                                                  <CalendarIcon className="w-3 h-3 text-slate-400 opacity-0 group-hover/rev:opacity-100" />
                                                </div>
                                                <input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => setNextRevisionDate(edital.id, area.id, materia.id, topico.id, sub.id, e.target.value)} />
                                              </div>

                                              <div className="col-span-2 lg:col-span-2 text-right flex justify-between lg:justify-end gap-2 items-center w-full mt-2 lg:mt-0">
                                                <div className="flex opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-3 lg:gap-1.5 align-middle">
                                                  <button onClick={() => setHistoryModal({ isOpen: true, title: sub.titulo, studyDate: sub.data_estudo, revisionDates: sub.revisoes_agendadas })} className="text-slate-400 hover:text-blue-500" title="Histórico"><History className="w-4 h-4 lg:w-3 lg:h-3" /></button>
                                                  <button onClick={() => setNotesModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, subtopicoId: sub.id, currentNote: sub.notas || '', title: sub.titulo })} className={`${sub.notas ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-amber-500'}`} title="Anotações"><StickyNote className="w-4 h-4 lg:w-3 lg:h-3" /></button>
                                                  <button onClick={() => handleEdit(sub.id, sub.titulo)} className="text-slate-400 hover:text-slate-600"><Edit2 className="w-4 h-4 lg:w-3 lg:h-3" /></button>
                                                  <button onClick={() => deleteItem(edital.id, area.id, materia.id, sub.id, 'subtopico')} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4 lg:w-3 lg:h-3" /></button>
                                                </div>
                                                {sub.visto ? (
                                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[8px] font-bold uppercase tracking-wider shrink-0">Concluí</span>
                                                ) : (
                                                  <span className="px-2 py-0.5 bg-white text-slate-500 border border-slate-200 rounded text-[8px] font-bold uppercase tracking-wider shrink-0">A Estudar</span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                   </div>
                                 )
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
         </div>
      </div>

      {notesModal && notesModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
               <div>
                 <h3 className="font-bold text-slate-800">Anotações</h3>
                 <p className="text-[10px] text-slate-500 font-mono mt-0.5">{notesModal.title}</p>
               </div>
               <button onClick={() => setNotesModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-1">
                <textarea 
                  autoFocus
                  placeholder="Escreva seus resumos, mnemônicos ou pontos de atenção aqui..."
                  className="w-full h-64 p-4 outline-none resize-none text-sm text-slate-700 bg-transparent"
                  value={notesModal.currentNote}
                  onChange={(e) => setNotesModal({ ...notesModal, currentNote: e.target.value })}
                />
             </div>
             <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                <button 
                  onClick={() => setNotesModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded transition-colors"
                >Cancelar</button>
                <button 
                  onClick={() => {
                    updateNota(edital.id, notesModal.areaId, notesModal.materiaId, notesModal.topicoId, notesModal.subtopicoId, notesModal.currentNote);
                    setNotesModal(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >Salvar Anotação</button>
             </div>
           </div>
        </div>
      )}
      {historyModal && historyModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
               <div>
                 <h3 className="font-bold text-slate-800">Histórico de Estudo</h3>
                 <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[250px]">{historyModal.title}</p>
               </div>
               <button onClick={() => setHistoryModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
             </div>
             
             <div className="p-5 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">
                <div>
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Primeiro Estudo</h4>
                   {historyModal.studyDate ? (
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                           <CalendarIcon className="w-4 h-4" />
                        </div>
                        <div>
                           <div className="text-sm font-bold text-slate-700">{format(new Date(historyModal.studyDate), "dd 'de' MMM, yyyy")}</div>
                           <div className="text-xs text-slate-500">Concluído</div>
                        </div>
                     </div>
                   ) : (
                     <div className="text-sm text-slate-500 italic">Tema ainda não estudado.</div>
                   )}
                </div>

                <div>
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Fila de Revisões</h4>
                   {historyModal.revisionDates && historyModal.revisionDates.length > 0 ? (
                      <div className="flex flex-col gap-3">
                         {historyModal.revisionDates
                            .map(d => new Date(d))
                            .sort((a,b) => a.getTime() - b.getTime())
                            .map((date, idx) => {
                               const isPastDate = isPast(date) && !isToday(date);
                               const isTodayDate = isToday(date);
                               return (
                                 <div key={idx} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPastDate ? 'bg-rose-50 text-rose-500' : isTodayDate ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
                                       <History className="w-4 h-4" />
                                    </div>
                                    <div>
                                       <div className={`text-sm font-bold ${isPastDate ? 'text-rose-600' : isTodayDate ? 'text-amber-600' : 'text-slate-700'}`}>{format(date, "dd 'de' MMM, yyyy")}</div>
                                       <div className="text-xs text-slate-500">{isPastDate ? 'Atrasada' : isTodayDate ? 'Para hoje' : 'Agendada'}</div>
                                    </div>
                                 </div>
                               )
                            })}
                      </div>
                   ) : (
                      <div className="text-sm text-slate-500 italic">Nenhuma revisão agendada.</div>
                   )}
                </div>
             </div>
             
             <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
                <button 
                  onClick={() => setHistoryModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded transition-colors"
                >Fechar</button>
             </div>
           </div>
        </div>
      )}
    </>
  )
}
