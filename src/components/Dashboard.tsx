import React, { useMemo, useState } from "react";
import { useEdital } from "../store";
import { format, isToday } from "date-fns";
import {  AlertCircle, CheckCircle2, TrendingUp, BookOpen, Clock, Target, Calendar, ChevronLeft , Pin } from "lucide-react";

export function Dashboard() {
  const [selectedMateriaId, setSelectedMateriaId] = useState<string | null>(null);
  const { editais, revisions, completeRevision, pinnedEditalId, setPinnedEditalId } = useEdital();
  const [selectedEditalId, setSelectedEditalId] = useState<string>(pinnedEditalId || 'all');

  React.useEffect(() => {
    if (pinnedEditalId) {
      setSelectedEditalId(pinnedEditalId);
    }
  }, [pinnedEditalId]);

  const filteredRevisions = selectedEditalId === 'all' ? revisions : revisions.filter(r => r.editalId === selectedEditalId);
  const totalAtrasadas = filteredRevisions.filter(r => r.atrasada).length;
  const totalHoje = filteredRevisions.filter(r => !r.atrasada && isToday(new Date(r.dataRevisao))).length;

  const groupedRevisions = useMemo(() => {
    // Sort all by oldest date first
    const sorted = [...filteredRevisions].sort((a, b) => {
      const timeA = new Date(a.dataRevisao).getTime();
      const timeB = new Date(b.dataRevisao).getTime();
      return timeA - timeB;
    });

    const groups: { materiaNome: string, materiaId: string, editalId?: string, items: typeof revisions }[] = [];
    const idMap = new Map<string, number>();

    for (const rev of sorted) {
       const key = rev.materiaId;
       if (!idMap.has(key)) {
          idMap.set(key, groups.length);
          groups.push({ materiaNome: rev.materiaNome, materiaId: rev.materiaId, editalId: rev.editalId, items: [] });
       }
       groups[idMap.get(key)!].items.push(rev);
    }
    
    return groups;
  }, [filteredRevisions]);

  // General Stats Calculation
  let totalTopics = 0;
  let doneTopics = 0;
  let totalAcertos = 0;
  let totalErros = 0;
  
  const filteredEditais = selectedEditalId === 'all' ? editais : editais.filter(e => e.id === selectedEditalId);
  filteredEditais.forEach(edital => {
    (edital?.areas || []).forEach(area => {
      (area?.materias || []).forEach(materia => {
        (materia?.topicos || []).forEach(t => {
          totalTopics++;
          if (t.visto) doneTopics++;
          if (t.acertos) totalAcertos += t.acertos;
          if (t.erros) totalErros += t.erros;
          t.subtopicos.forEach(s => {
            totalTopics++;
            if (s.visto) doneTopics++;
            if (s.acertos) totalAcertos += s.acertos;
            if (s.erros) totalErros += s.erros;
          })
        })
      })
    })
  });

  const progressPercent = totalTopics === 0 ? 0 : Math.round((doneTopics / totalTopics) * 100);
  const totalQuestions = totalAcertos + totalErros;
  const accuracy = totalQuestions === 0 ? 0 : Math.round((totalAcertos / totalQuestions) * 100);
  const netScore = totalAcertos - totalErros; 

  const pieData = [
    { name: 'Acertos', value: totalAcertos, color: '#10b981' },
    { name: 'Erros', value: totalErros, color: '#f43f5e' },
  ].filter(d => d.value > 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto custom-scrollbar text-slate-800 selection:bg-blue-900/30">
      <header className="h-24 px-8 flex items-center justify-between shrink-0 border-b border-slate-200 bg-slate-50/50 backdrop-blur-xl sticky top-0 z-30">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">Dashboard Central</h2>
          <p className="text-[10px] text-blue-800 font-bold uppercase tracking-[0.2em] mt-1">Visão Geral de Desempenho</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <select 
            value={selectedEditalId} 
            onChange={e => setSelectedEditalId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 transition-colors shadow-sm"
          >
            <option value="all">Todos os Editais</option>
            {editais.map(e => (
              <option key={e.id} value={e.id}>{e.titulo || 'Edital sem título'}</option>
            ))}
          </select>
            {selectedEditalId !== 'all' && setPinnedEditalId && (
              <button 
                onClick={() => setPinnedEditalId(pinnedEditalId === selectedEditalId ? null : selectedEditalId)}
                className={`p-2 flex items-center justify-center rounded-xl transition-all border ${pinnedEditalId === selectedEditalId ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:text-amber-500'}`}
                title={pinnedEditalId === selectedEditalId ? "Desafixar Edital" : "Fixar Edital como Padrão"}
              >
                <Pin className={`w-4 h-4 ${pinnedEditalId === selectedEditalId ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 text-[11px] font-mono font-bold text-slate-400">
             <Calendar className="w-3.5 h-3.5" />
             {format(new Date(), "eeee, dd MMMM")}
          </div>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Banner Alert */}
        {totalAtrasadas > 0 && (
           <div className="relative overflow-hidden bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 flex items-start sm:items-center gap-5 transition-all hover:bg-rose-500/10 active:scale-[0.99]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl -mr-16 -mt-16 rounded-full"></div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/20">
                <AlertCircle className="w-6 h-6 text-rose-400" />
              </div>
              <div className="flex-1 z-10">
                 <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                   Atenção Requerida
                   <span className="text-[10px] bg-rose-500 text-slate-900 px-1.5 py-0.5 rounded-md font-mono">{totalAtrasadas}</span>
                 </h3>
                 <p className="text-xs text-rose-400/70 mt-1 font-medium leading-relaxed">Você possui revisões atrasadas. Regularize o quanto antes para garantir a eficiência do método de repetição espaçada.</p>
              </div>
           </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {/* Progress */}
           <div className="bg-white shadow-sm rounded-3xl p-6 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-all">
                   <BookOpen className="w-5 h-5" />
                 </div>
                 <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Estudo</div>
              </div>
              <div>
                 <div className="flex items-baseline gap-2 mb-2">
                   <span className="text-3xl font-display font-bold text-slate-900 tracking-tighter">{progressPercent}%</span>
                   <span className="text-[10px] font-bold text-emerald-400/70 border border-emerald-400/20 bg-emerald-400/5 px-2 py-0.5 rounded">CONCLUÍDO</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">{doneTopics} de {totalTopics} tópicos vistos</p>
              </div>
           </div>

           {/* Performance */}
           <div className="bg-white shadow-sm rounded-3xl p-6 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-10 h-10 rounded-xl bg-blue-900/10 flex items-center justify-center border border-blue-900/20 text-blue-800 group-hover:bg-blue-900 group-hover:text-slate-900 transition-all">
                   <Target className="w-5 h-5" />
                 </div>
                 <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Performance</div>
              </div>
              <div>
                 <div className="flex items-baseline gap-2 mb-2">
                   <span className="text-3xl font-display font-bold text-slate-900 tracking-tighter">{accuracy}%</span>
                   <span className="text-[10px] font-bold text-blue-800/70 border border-blue-800/20 bg-blue-800/5 px-2 py-0.5 rounded">TAXA ACERTO</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest pt-3 border-t border-slate-200">
                   <span className="text-slate-400">Saldo Líquido</span>
                   <span className={netScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                     {netScore > 0 ? '+' : ''}{netScore} <span className="text-[8px] opacity-60">PTS</span>
                   </span>
                 </div>
              </div>
           </div>

           {/* Tasks Today */}
           <div className="bg-white shadow-sm rounded-3xl p-6 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-900 transition-all">
                   <Clock className="w-5 h-5" />
                 </div>
                 <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Pauta</div>
              </div>
              <div>
                 <div className="text-3xl font-display font-bold text-slate-900 tracking-tighter mb-1">{totalHoje}</div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revisões para hoje</p>
              </div>
           </div>

           {/* Delayed */}
           <div className="bg-white shadow-sm rounded-3xl p-6 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400 group-hover:bg-rose-500 group-hover:text-slate-900 transition-all">
                   <TrendingUp className="w-5 h-5" />
                 </div>
                 <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Backlog</div>
              </div>
              <div>
                 <div className="text-3xl font-display font-bold text-slate-900 tracking-tighter mb-1">{totalAtrasadas}</div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temas Pendentes</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           
           {/* Recent Tasks */}
           <div className="lg:col-span-12 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
              <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white">
                 <h3 className="font-display font-bold text-lg text-slate-900">Tarefas de Revisão</h3>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-900 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{revisions.length} Tópicos</span>
                 </div>
              </div>

              <div className="flex-1 p-6 lg:min-h-[500px]">
                 {revisions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                       <div className="w-16 h-16 rounded-[2rem] bg-blue-900/5 border border-blue-900/10 flex items-center justify-center mb-6">
                          <CheckCircle2 className="w-8 h-8 text-blue-900/40" />
                       </div>
                       <p className="text-sm font-bold text-slate-900 tracking-tight">Zero Pendências!</p>
                       <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed uppercase tracking-widest font-semibold">Toda sua pauta de revisão está em dia. Continue avançando em novos tópicos.</p>
                    </div>
                 ) : selectedMateriaId && groupedRevisions.some(g => g.materiaId === selectedMateriaId) ? (
                    <div className="flex flex-col h-full max-h-[500px]">
                       <div className="flex items-center gap-3 mb-6 shrink-0">
                          <button onClick={() => setSelectedMateriaId(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-600">
                             <ChevronLeft className="w-4 h-4"/>
                          </button>
                          <h4 className="font-bold text-slate-800 text-sm uppercase tracking-widest">{groupedRevisions.find(g => g.materiaId === selectedMateriaId)?.materiaNome}</h4>
                       </div>
                       <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                          {groupedRevisions.find(g => g.materiaId === selectedMateriaId)?.items.map((rev, idx) => (
                             <div key={`${rev.topicoOuSubId}-${idx}`} className={`group flex flex-col p-4 rounded-2xl border ${rev.atrasada ? 'bg-rose-50/50 border-rose-100 shadow-sm' : 'bg-slate-50 border-slate-100 shadow-sm'} transition-all hover:border-slate-300`}>
                                <div className="flex items-start gap-4 w-full">
                                   <label className="relative flex items-center justify-center cursor-pointer shrink-0 mt-0.5">
                                      <input type="checkbox" className="peer sr-only" onChange={() => completeRevision(rev.topicoOuSubId, rev.dataRevisao)} />
                                      <div className="w-5 h-5 border-2 border-slate-300 rounded-lg peer-checked:bg-blue-900 peer-checked:border-blue-900 transition-all flex items-center justify-center group-hover:border-blue-900/50 bg-white">
                                         <CheckCircle2 className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                      </div>
                                   </label>
                                   <div className="min-w-0 flex-1">
                                      <div className="text-[13px] leading-snug font-bold text-slate-800 line-clamp-2 group-hover:text-slate-900 transition-colors" title={rev.tituloItem}>{rev.tituloItem}</div>
                                      <div className="flex items-center gap-2 mt-1.5 opacity-60">
                                         <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase truncate">{rev.editalTitulo}</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/60">
                                   <div className={`text-[11px] font-mono font-bold tracking-tight ${rev.atrasada ? 'text-rose-500' : 'text-slate-500'}`}>
                                      {rev.atrasada ? format(new Date(rev.dataRevisao), "dd/MM") : "HOJE"}
                                   </div>
                                   <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border ${rev.atrasada ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-slate-200/50 text-slate-500 border-slate-200'}`}>
                                     {rev.atrasada ? 'Atrasado' : 'Prioridade'}
                                   </span>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
                       {groupedRevisions.map((group) => {
                          const atrasadosCount = group.items.filter(r => r.atrasada).length;
                          return (
                             <div 
                                key={group.materiaId} 
                                onClick={() => setSelectedMateriaId(group.materiaId)}
                                className="bg-slate-50 border border-slate-200 rounded-3xl p-5 cursor-pointer hover:border-blue-900/30 hover:shadow-md transition-all flex flex-col justify-between aspect-square group"
                             >
                                <div className="flex justify-between items-start">
                                   <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                                      <BookOpen className="w-5 h-5"/>
                                   </div>
                                   <span className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-lg uppercase tracking-wider">
                                      {group.items.length} tópicos
                                   </span>
                                </div>
                                <div className="mt-4">
                                   {atrasadosCount > 0 && (
                                      <div className="mb-3">
                                         <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-rose-50 text-rose-600 text-[9px] font-bold uppercase tracking-wider rounded border border-rose-100">
                                            <AlertCircle className="w-3 h-3" />
                                            {atrasadosCount} atrasados
                                         </span>
                                      </div>
                                   )}
                                   <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-3">{group.materiaNome}</h4>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 )}
              </div>
           </div>



        </div>
      </div>
    </div>
  );
}
