import { useState } from "react";
import { useEdital } from "../store";
import { format, isPast, isToday } from "date-fns";
import { AlertCircle, CheckCircle2, TrendingUp, BookOpen, Clock, Target } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export function Dashboard() {
  const { editais, revisions, completeRevision } = useEdital();

  const totalAtrasadas = revisions.filter(r => r.atrasada).length;
  const totalHoje = revisions.filter(r => !r.atrasada && isToday(new Date(r.dataRevisao))).length;

  // General Stats Calculation
  let totalTopics = 0;
  let doneTopics = 0;
  let totalMaterias = 0;
  let totalAcertos = 0;
  let totalErros = 0;
  
  editais.forEach(edital => {
    edital.areas.forEach(area => {
      area.materias.forEach(materia => {
        totalMaterias++;
        materia.topicos.forEach(t => {
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
  const netScore = totalAcertos - totalErros; // Cebraspe metric

  const pieData = [
    { name: 'Acertos', value: totalAcertos, color: '#10B981' },
    { name: 'Erros', value: totalErros, color: '#F43F5E' },
  ].filter(d => d.value > 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B1120] overflow-y-auto text-slate-300">
      <header className="h-24 px-8 flex items-end pb-4 shrink-0">
        <div className="flex flex-col">
          <h2 className="text-2xl font-display font-bold text-white leading-tight">Visão Geral</h2>
          <p className="text-sm text-slate-400 font-medium">Acompanhe seu progresso, desempenho e revisões.</p>
        </div>
      </header>

      {/* Alert Banner for Delayed Items */}
      {totalAtrasadas > 0 && (
         <div className="mx-6 mt-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start sm:items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-400" />
            </div>
            <div className="flex-1">
               <h3 className="text-sm font-bold text-rose-400">Você tem {totalAtrasadas} {totalAtrasadas === 1 ? 'revisão atrasada' : 'revisões atrasadas'}!</h3>
               <p className="text-xs text-rose-400/80 mt-0.5 font-medium">Mantenha a constância. Regularize os assuntos em atraso para o algoritmo funcionar com eficiência.</p>
            </div>
         </div>
      )}

      <div className="p-6 space-y-6 flex-1 flex flex-col min-h-0">
          
          {/* General Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
             
             {/* Progress Box */}
             <div className="bg-[#111827] rounded-3xl p-6 shadow-md border border-slate-800/80 flex flex-col justify-between group hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-4 text-emerald-400">
                   <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                     <BookOpen className="w-5 h-5" />
                   </div>
                </div>
                <div>
                   <div className="flex items-baseline gap-2">
                     <div className="text-3xl font-display font-bold text-white">{progressPercent}%</div>
                   </div>
                   <div className="w-full bg-[#1E293B] h-1.5 rounded-full mt-2 mb-2 overflow-hidden shadow-inner">
                     <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                   </div>
                   <p className="text-xs font-medium text-slate-500">{doneTopics} de {totalTopics} tópicos vistos</p>
                </div>
             </div>

             {/* Performance Box */}
             <div className="bg-[#111827] rounded-3xl p-6 shadow-md border border-slate-800/80 flex flex-col justify-between group hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-4 text-indigo-400">
                   <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                     <Target className="w-5 h-5" />
                   </div>
                </div>
                <div>
                   <div className="flex items-baseline gap-2">
                     <div className="text-3xl font-display font-bold text-white">{accuracy}%</div>
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Acerto</span>
                   </div>
                   <div className="flex justify-between items-center mt-2 text-xs font-medium">
                     <span className="text-emerald-400">{totalAcertos} Acertos</span>
                     <span className="text-rose-400">{totalErros} Erros</span>
                   </div>
                   <div className="mt-1 pt-1 border-t border-slate-800 w-full flex justify-between">
                     <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Saldo Líquido</span>
                     <span className={`text-[11px] font-bold ${netScore > 0 ? 'text-emerald-400' : netScore < 0 ? 'text-rose-400' : 'text-slate-500'}`}>{netScore > 0 ? '+' : ''}{netScore} pts</span>
                   </div>
                </div>
             </div>

             <div className="bg-[#111827] rounded-3xl p-6 shadow-md border border-slate-800/80 flex flex-col justify-between group hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-4 text-amber-400">
                   <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                     <Clock className="w-5 h-5" />
                   </div>
                </div>
                <div>
                   <div className="text-3xl font-display font-bold text-white">{totalHoje}</div>
                   <p className="text-sm font-medium text-slate-500 mt-1">Revisões agendadas p/ hoje</p>
                </div>
             </div>

             <div className="bg-[#111827] rounded-3xl p-6 shadow-md border border-slate-800/80 flex flex-col justify-between group hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-4 text-rose-400">
                   <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                     <TrendingUp className="w-5 h-5" />
                   </div>
                </div>
                <div>
                   <div className="text-3xl font-display font-bold text-white">{totalAtrasadas}</div>
                   <p className="text-sm font-medium text-slate-500 mt-1">Revisões acumuladas</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-[400px]">
              
              {/* Próximas Revisões View */}
              <div className="bg-[#111827] rounded-3xl shadow-md border border-slate-800/80 flex flex-col xl:col-span-2">
                <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between shrink-0">
                   <h3 className="font-display font-bold text-lg text-white">Próximas Revisões</h3>
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{revisions.length} TAREFAS</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2">
                   <div className="h-full flex flex-col">
                      <div className="flex-1 text-[13px]">
                        {revisions.length === 0 ? (
                           <div className="p-8 text-center text-slate-500 mt-12 flex flex-col items-center">
                              <div className="w-16 h-16 bg-[#162032] border border-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                                 <CheckCircle2 className="w-8 h-8 text-emerald-500/70" />
                              </div>
                              <p className="text-base font-medium text-slate-400">Nenhuma revisão pendente</p>
                              <p className="mt-1 text-slate-600">Avance no edital para gerar novas revisões!</p>
                           </div>
                        ) : (
                          revisions.map((rev, idx) => (
                            <div key={`${rev.topicoOuSubId}-${idx}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl hover:bg-[#1E293B] transition-colors group border border-transparent hover:border-slate-800/80 mb-1">
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                 <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                                    <input 
                                       type="checkbox" 
                                       className="peer sr-only" 
                                       onChange={() => completeRevision(rev.topicoOuSubId, rev.dataRevisao)} 
                                    />
                                    <div className="w-6 h-6 border-2 border-slate-600 rounded-full peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center bg-[#0B1120]">
                                       <CheckCircle2 className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                 </label>
                                 <div className="min-w-0" title={`${rev.editalTitulo} / ${rev.materiaNome} - ${rev.tituloItem}`}>
                                    <div className="font-medium text-white truncate mb-0.5">{rev.tituloItem}</div>
                                    <div className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                                       <BookOpen className="w-3 h-3" />
                                       <span>{rev.materiaNome}</span>
                                       <span className="text-slate-700">•</span>
                                       <span className="opacity-75">{rev.editalTitulo}</span>
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="mt-3 sm:mt-0 pl-10 sm:pl-0 flex items-center gap-4 shrink-0 text-right w-full sm:w-auto justify-between sm:justify-end">
                                 <div className="flex items-center gap-2">
                                    <Clock className={`w-4 h-4 ${rev.atrasada ? 'text-rose-500' : 'text-slate-500'}`} />
                                    <span className={`font-mono font-medium ${rev.atrasada ? 'text-rose-500' : 'text-slate-400'}`}>
                                       {rev.atrasada ? format(new Date(rev.dataRevisao), "dd/MM") : "HOJE"}
                                    </span>
                                 </div>
                                 
                                 <div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase border ${rev.atrasada ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
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

              {/* Gráfico de Desempenho */}
              <div className="bg-[#111827] rounded-3xl shadow-md border border-slate-800/80 flex flex-col">
                <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between shrink-0">
                   <h3 className="font-display font-bold text-lg text-white">Desempenho Geral</h3>
                </div>
                <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[300px]">
                   {totalQuestions === 0 ? (
                      <div className="text-center text-slate-500 flex flex-col items-center">
                        <Target className="w-10 h-10 mb-3 text-slate-700" />
                        <p className="text-sm">Sem dados de resolução.</p>
                        <p className="text-xs mt-1 text-slate-600">Preencha [Ac.] e [Er.] nos tópicos.</p>
                      </div>
                   ) : (
                      <div className="w-full h-full flex flex-col items-center">
                        <div className="flex-1 w-full min-h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-2 w-full">
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                             <span className="text-xs font-medium text-slate-300">Acertos ({totalAcertos})</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                             <span className="text-xs font-medium text-slate-300">Erros ({totalErros})</span>
                           </div>
                        </div>
                      </div>
                   )}
                </div>
              </div>
          </div>
      </div>
    </div>
  );
}
