import { useState } from "react";
import { useEdital } from "../store";
import { format, isPast, isToday } from "date-fns";
import { AlertCircle, CheckCircle2, TrendingUp, BookOpen, Clock } from "lucide-react";

export function Dashboard() {
  const { editais, revisions, completeRevision } = useEdital();

  const totalAtrasadas = revisions.filter(r => r.atrasada).length;
  const totalHoje = revisions.filter(r => !r.atrasada && isToday(new Date(r.dataRevisao))).length;

  // General Stats Calculation
  let totalTopics = 0;
  let doneTopics = 0;
  let totalMaterias = 0;
  
  editais.forEach(edital => {
    edital.areas.forEach(area => {
      area.materias.forEach(materia => {
        totalMaterias++;
        materia.topicos.forEach(t => {
          totalTopics++;
          if (t.visto) doneTopics++;
          t.subtopicos.forEach(s => {
            totalTopics++;
            if (s.visto) doneTopics++;
          })
        })
      })
    })
  });

  const progressPercent = totalTopics === 0 ? 0 : Math.round((doneTopics / totalTopics) * 100);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-y-auto">
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 leading-tight">Painel Direcionado & Estatísticas</h2>
          <p className="text-xs text-slate-500 font-mono">Visão Geral // STUDY_SYSTEM_CORE</p>
        </div>
      </header>

      {/* Alert Banner for Delayed Items */}
      {totalAtrasadas > 0 && (
         <div className="mx-6 mt-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1">
               <h3 className="text-sm font-bold text-rose-800">Você tem {totalAtrasadas} {totalAtrasadas === 1 ? 'revisão atrasada' : 'revisões atrasadas'}!</h3>
               <p className="text-xs text-rose-600 mt-0.5">Mantenha a constância. Regularize os assuntos em atraso para o algoritmo funcionar com eficiência.</p>
            </div>
         </div>
      )}

      <div className="p-6 space-y-6 flex-1 flex flex-col min-h-0">
          
          {/* General Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
             <div className="bg-white border text-center sm:text-left border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex sm:justify-between items-center justify-center gap-3 mb-2 text-slate-500">
                   <BookOpen className="w-5 h-5" />
                   <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Matérias</span>
                </div>
                <div className="text-2xl font-bold text-slate-800">{totalMaterias}</div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">Registradas</p>
             </div>
             
             <div className="bg-white border text-center sm:text-left border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex sm:justify-between items-center justify-center gap-3 mb-2 text-blue-500">
                   <CheckCircle2 className="w-5 h-5" />
                   <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Progresso</span>
                </div>
                <div className="text-2xl font-bold text-slate-800">{progressPercent}%</div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">{doneTopics} de {totalTopics} tópicos</p>
             </div>

             <div className="bg-white border text-center sm:text-left border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex sm:justify-between items-center justify-center gap-3 mb-2 text-amber-500">
                   <Clock className="w-5 h-5" />
                   <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Agendadas P/ Hoje</span>
                </div>
                <div className="text-2xl font-bold text-slate-800">{totalHoje}</div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">Tópicos</p>
             </div>

             <div className="bg-white border text-center sm:text-left border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex sm:justify-between items-center justify-center gap-3 mb-2 text-rose-500">
                   <TrendingUp className="w-5 h-5" />
                   <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Atrasadas</span>
                </div>
                <div className="text-2xl font-bold text-slate-800">{totalAtrasadas}</div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">Acumuladas</p>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
               <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Fila de Revisões Prioritárias</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto">
               <div className="h-full flex flex-col">
                  <div className="hidden sm:grid grid-cols-12 bg-white border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3 px-4 shrink-0">
                    <div className="col-span-1 text-center">Visto</div>
                    <div className="col-span-4">Edital / Matéria</div>
                    <div className="col-span-3">Tópico</div>
                    <div className="col-span-2 text-center">Data</div>
                    <div className="col-span-2 text-right">Status</div>
                  </div>

                  <div className="flex-1 font-mono text-[11px]">
                    {revisions.length === 0 ? (
                       <div className="p-8 text-center text-slate-400 mt-10">
                          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-3 opacity-50" />
                          <p className="text-sm font-sans font-medium text-slate-500">Sua fila de revisão está vazia.</p>
                          <p className="mt-1">Continue estudando novos tópicos!</p>
                       </div>
                    ) : (
                      revisions.map((rev, idx) => (
                        <div key={`${rev.topicoOuSubId}-${idx}`} className="flex flex-col sm:grid sm:grid-cols-12 border-b border-slate-100 py-3 px-4 items-start sm:items-center hover:bg-slate-50 transition-colors group">
                          <div className="flex items-center gap-3 w-full sm:w-auto sm:col-span-5">
                             <input 
                                type="checkbox" 
                                className="accent-blue-600 w-4 h-4 cursor-pointer pt-1 shrink-0" 
                                onChange={() => completeRevision(rev.topicoOuSubId, rev.dataRevisao)} 
                             />
                             <div className="font-sans font-medium text-slate-700 truncate pr-4 w-full" title={`${rev.editalTitulo} / ${rev.materiaNome}`}>
                                {rev.editalTitulo} <span className="text-slate-400 font-normal">/ {rev.materiaNome}</span>
                             </div>
                          </div>
                          <div className="mt-2 sm:mt-0 pl-7 sm:pl-0 sm:col-span-3 font-sans text-slate-600 sm:border-l-2 sm:border-blue-200 sm:ml-1 w-full truncate" title={rev.tituloItem}>
                             <span className="sm:hidden text-[9px] font-bold uppercase text-slate-400 mr-2">Tópico:</span>
                             {rev.tituloItem}
                          </div>
                          <div className="mt-2 sm:mt-0 pl-7 sm:pl-0 sm:col-span-2 text-left sm:text-center text-slate-500 flex items-center justify-between sm:justify-center w-full">
                             <div className="flex items-center gap-1">
                                <span className="sm:hidden text-[9px] font-bold uppercase text-slate-400">Data:</span>
                                {rev.atrasada ? <span className="text-rose-500 font-bold underline underline-offset-2">{format(new Date(rev.dataRevisao), "dd/MM")}</span> : "HOJE"}
                             </div>
                             
                             <div className="sm:hidden text-right">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${rev.atrasada ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                                  {rev.atrasada ? 'ATRASADO' : 'AGENDADO'}
                                </span>
                             </div>
                          </div>
                          <div className="hidden sm:block sm:col-span-2 text-right">
                             <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${rev.atrasada ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                               {rev.atrasada ? 'ATRASADO' : 'AGENDADO'}
                             </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
               </div>
            </div>
          </div>
      </div>
    </div>
  );
}
