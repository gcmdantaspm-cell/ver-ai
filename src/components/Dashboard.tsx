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
    <div className="flex-1 flex flex-col h-full bg-[#F5F7FA] overflow-y-auto">
      <header className="h-24 px-8 flex items-end pb-4 shrink-0">
        <div className="flex flex-col">
          <h2 className="text-2xl font-display font-bold text-slate-900 leading-tight">Visão Geral</h2>
          <p className="text-sm text-slate-500 font-medium">Acompanhe seu progresso e revisões.</p>
        </div>
      </header>

      {/* Alert Banner for Delayed Items */}
      {totalAtrasadas > 0 && (
         <div className="mx-6 mt-2 bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start sm:items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1">
               <h3 className="text-sm font-bold text-rose-800">Você tem {totalAtrasadas} {totalAtrasadas === 1 ? 'revisão atrasada' : 'revisões atrasadas'}!</h3>
               <p className="text-xs text-rose-600 mt-0.5 font-medium">Mantenha a constância. Regularize os assuntos em atraso para o algoritmo funcionar com eficiência.</p>
            </div>
         </div>
      )}

      <div className="p-6 space-y-6 flex-1 flex flex-col min-h-0">
          
          {/* General Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4 text-indigo-500">
                   <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                     <BookOpen className="w-5 h-5" />
                   </div>
                </div>
                <div>
                   <div className="text-3xl font-display font-bold text-slate-900">{totalMaterias}</div>
                   <p className="text-sm font-medium text-slate-500 mt-1">Matérias cadastradas</p>
                </div>
             </div>
             
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4 text-emerald-500">
                   <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                     <CheckCircle2 className="w-5 h-5" />
                   </div>
                </div>
                <div>
                   <div className="flex items-baseline gap-2">
                     <div className="text-3xl font-display font-bold text-slate-900">{progressPercent}%</div>
                   </div>
                   <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 mb-2">
                     <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                   </div>
                   <p className="text-xs font-medium text-slate-500">{doneTopics} de {totalTopics} tópicos vistos</p>
                </div>
             </div>

             <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4 text-amber-500">
                   <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                     <Clock className="w-5 h-5" />
                   </div>
                </div>
                <div>
                   <div className="text-3xl font-display font-bold text-slate-900">{totalHoje}</div>
                   <p className="text-sm font-medium text-slate-500 mt-1">Agendadas para hoje</p>
                </div>
             </div>

             <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4 text-rose-500">
                   <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                     <TrendingUp className="w-5 h-5" />
                   </div>
                </div>
                <div>
                   <div className="text-3xl font-display font-bold text-slate-900">{totalAtrasadas}</div>
                   <p className="text-sm font-medium text-slate-500 mt-1">Acumuladas</p>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100/50 flex flex-col flex-1 min-h-[400px]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
               <h3 className="font-display font-bold text-lg text-slate-800">Próximas Revisões</h3>
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{revisions.length} TAREFAS</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
               <div className="h-full flex flex-col">
                  <div className="flex-1 text-[13px]">
                    {revisions.length === 0 ? (
                       <div className="p-8 text-center text-slate-400 mt-16 flex flex-col items-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                             <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                          </div>
                          <p className="text-base font-medium text-slate-600">Nenhuma revisão pendente</p>
                          <p className="mt-1">Continue estudando novos tópicos!</p>
                       </div>
                    ) : (
                      revisions.map((rev, idx) => (
                        <div key={`${rev.topicoOuSubId}-${idx}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100 mb-1">
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                             <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                                <input 
                                   type="checkbox" 
                                   className="peer sr-only" 
                                   onChange={() => completeRevision(rev.topicoOuSubId, rev.dataRevisao)} 
                                />
                                <div className="w-6 h-6 border-2 border-slate-200 rounded-full peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                                   <CheckCircle2 className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                             </label>
                             <div className="min-w-0" title={`${rev.editalTitulo} / ${rev.materiaNome} - ${rev.tituloItem}`}>
                                <div className="font-medium text-slate-800 truncate mb-0.5">{rev.tituloItem}</div>
                                <div className="text-xs text-slate-400 truncate flex items-center gap-1.5">
                                   <BookOpen className="w-3 h-3" />
                                   <span>{rev.materiaNome}</span>
                                   <span className="text-slate-300">•</span>
                                   <span className="opacity-75">{rev.editalTitulo}</span>
                                </div>
                             </div>
                          </div>
                          
                          <div className="mt-3 sm:mt-0 pl-10 sm:pl-0 flex items-center gap-4 shrink-0 text-right w-full sm:w-auto justify-between sm:justify-end">
                             <div className="flex items-center gap-2">
                                <Clock className={`w-4 h-4 ${rev.atrasada ? 'text-rose-400' : 'text-slate-400'}`} />
                                <span className={`font-mono font-medium ${rev.atrasada ? 'text-rose-600' : 'text-slate-600'}`}>
                                   {rev.atrasada ? format(new Date(rev.dataRevisao), "dd/MM") : "HOJE"}
                                </span>
                             </div>
                             
                             <div>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase ${rev.atrasada ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                                  {rev.atrasada ? 'Atrasado' : 'Agendado'}
                                </span>
                             </div>
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
