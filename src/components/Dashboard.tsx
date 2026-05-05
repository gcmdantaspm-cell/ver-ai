import { useEdital } from "../store";
import { format, isToday } from "date-fns";
import { AlertCircle, CheckCircle2, TrendingUp, BookOpen, Clock, Target, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function Dashboard() {
  const { editais, revisions, completeRevision } = useEdital();

  const totalAtrasadas = revisions.filter(r => r.atrasada).length;
  const totalHoje = revisions.filter(r => !r.atrasada && isToday(new Date(r.dataRevisao))).length;

  // General Stats Calculation
  let totalTopics = 0;
  let doneTopics = 0;
  let totalAcertos = 0;
  let totalErros = 0;
  
  editais.forEach(edital => {
    edital.areas.forEach(area => {
      area.materias.forEach(materia => {
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
  const netScore = totalAcertos - totalErros; 

  const pieData = [
    { name: 'Acertos', value: totalAcertos, color: '#10b981' },
    { name: 'Erros', value: totalErros, color: '#f43f5e' },
  ].filter(d => d.value > 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030712] overflow-y-auto custom-scrollbar text-slate-300 selection:bg-indigo-500/30">
      <header className="h-24 px-8 flex items-center justify-between shrink-0 border-b border-white/5 bg-[#030712]/50 backdrop-blur-xl sticky top-0 z-30">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight">Dashboard Central</h2>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mt-1">Visão Geral de Desempenho</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[11px] font-mono font-bold text-slate-400">
           <Calendar className="w-3.5 h-3.5" />
           {format(new Date(), "eeee, dd MMMM")}
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
                   <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-md font-mono">{totalAtrasadas}</span>
                 </h3>
                 <p className="text-xs text-rose-400/70 mt-1 font-medium leading-relaxed">Você possui revisões atrasadas. Regularize o quanto antes para garantir a eficiência do método de repetição espaçada.</p>
              </div>
           </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {/* Progress */}
           <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                   <BookOpen className="w-5 h-5" />
                 </div>
                 <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Estudo</div>
              </div>
              <div>
                 <div className="flex items-baseline gap-2 mb-2">
                   <span className="text-3xl font-display font-bold text-white tracking-tighter">{progressPercent}%</span>
                   <span className="text-[10px] font-bold text-emerald-400/70 border border-emerald-400/20 bg-emerald-400/5 px-2 py-0.5 rounded">CONCLUÍDO</span>
                 </div>
                 <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                 </div>
                 <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-3">{doneTopics} de {totalTopics} tópicos vistos</p>
              </div>
           </div>

           {/* Performance */}
           <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                   <Target className="w-5 h-5" />
                 </div>
                 <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Performance</div>
              </div>
              <div>
                 <div className="flex items-baseline gap-2 mb-2">
                   <span className="text-3xl font-display font-bold text-white tracking-tighter">{accuracy}%</span>
                   <span className="text-[10px] font-bold text-indigo-400/70 border border-indigo-400/20 bg-indigo-400/5 px-2 py-0.5 rounded">TAXA ACERTO</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest pt-3 border-t border-white/5">
                   <span className="text-slate-600">Saldo Líquido</span>
                   <span className={netScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                     {netScore > 0 ? '+' : ''}{netScore} <span className="text-[8px] opacity-60">PTS</span>
                   </span>
                 </div>
              </div>
           </div>

           {/* Tasks Today */}
           <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
                   <Clock className="w-5 h-5" />
                 </div>
                 <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Pauta</div>
              </div>
              <div>
                 <div className="text-3xl font-display font-bold text-white tracking-tighter mb-1">{totalHoje}</div>
                 <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Revisões para hoje</p>
              </div>
           </div>

           {/* Delayed */}
           <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-all">
                   <TrendingUp className="w-5 h-5" />
                 </div>
                 <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Backlog</div>
              </div>
              <div>
                 <div className="text-3xl font-display font-bold text-white tracking-tighter mb-1">{totalAtrasadas}</div>
                 <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Temas Pendentes</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           
           {/* Recent Tasks */}
           <div className="lg:col-span-8 bg-white/[0.01] rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col min-h-[500px]">
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                 <h3 className="font-display font-bold text-lg text-white">Tarefas de Revisão</h3>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{revisions.length} Tópicos</span>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                 {revisions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                       <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center mb-6">
                          <CheckCircle2 className="w-8 h-8 text-indigo-500/40" />
                       </div>
                       <p className="text-sm font-bold text-white tracking-tight">Zero Pendências!</p>
                       <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed uppercase tracking-widest font-semibold">Toda sua pauta de revisão está em dia. Continue avançando em novos tópicos.</p>
                    </div>
                 ) : (
                    <div className="space-y-2">
                       {revisions.map((rev, idx) => (
                         <div key={`${rev.topicoOuSubId}-${idx}`} className={`group flex items-center justify-between p-5 rounded-2xl border border-transparent hover:bg-white/[0.02] hover:border-white/5 transition-all ${rev.atrasada ? 'bg-rose-500/5' : 'bg-transparent'}`}>
                            <div className="flex items-center gap-5 flex-1 min-w-0">
                               <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                                  <input type="checkbox" className="peer sr-only" onChange={() => completeRevision(rev.topicoOuSubId, rev.dataRevisao)} />
                                  <div className="w-5 h-5 border-2 border-white/10 rounded-lg peer-checked:bg-white peer-checked:border-white transition-all flex items-center justify-center group-hover:border-indigo-500/50">
                                     <CheckCircle2 className="w-3.5 h-3.5 text-[#030712] opacity-0 peer-checked:opacity-100 transition-opacity" />
                                  </div>
                               </label>
                               <div className="min-w-0">
                                  <div className="text-[13px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">{rev.tituloItem}</div>
                                  <div className="flex items-center gap-3 mt-1.5 opacity-60">
                                     <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{rev.materiaNome}</span>
                                     <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{rev.editalTitulo}</span>
                                  </div>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-6 shrink-0 ml-4">
                               <div className="hidden sm:flex flex-col items-end">
                                  <div className={`text-[10px] font-mono font-bold tracking-tight ${rev.atrasada ? 'text-rose-400/80' : 'text-slate-500'}`}>
                                     {rev.atrasada ? format(new Date(rev.dataRevisao), "dd/MM") : "HOJE"}
                                  </div>
                               </div>
                               <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border shrink-0 ${rev.atrasada ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-white/5 text-slate-400 border-white/5'}`}>
                                 {rev.atrasada ? 'Atrasado' : 'Prioridade'}
                               </span>
                            </div>
                         </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>

           {/* Chart */}
           <div className="lg:col-span-4 bg-white/[0.01] rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col h-full min-h-[500px]">
              <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01]">
                 <h3 className="font-display font-bold text-lg text-white">Desempenho</h3>
              </div>
              <div className="flex-1 p-8 flex flex-col">
                 {totalQuestions === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                       <Target className="w-16 h-16 mb-6 stroke-1" />
                       <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Sem dados</p>
                    </div>
                 ) : (
                    <>
                       <div className="flex-1 min-h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie
                                   data={pieData}
                                   cx="50%"
                                   cy="50%"
                                   innerRadius={80}
                                   outerRadius={110}
                                   paddingAngle={8}
                                   dataKey="value"
                                   stroke="none"
                                >
                                   {pieData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                   ))}
                                </Pie>
                                <Tooltip 
                                   contentStyle={{ backgroundColor: '#030712', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                                   itemStyle={{ color: '#fff' }}
                                />
                             </PieChart>
                          </ResponsiveContainer>
                       </div>
                       <div className="mt-8 space-y-3">
                          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 transition-all hover:bg-emerald-500/10">
                             <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Acertos</span>
                             </div>
                             <span className="text-sm font-mono font-bold text-emerald-400">{totalAcertos}</span>
                          </div>
                          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/10 transition-all hover:bg-rose-500/10">
                             <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Erros</span>
                             </div>
                             <span className="text-sm font-mono font-bold text-rose-400">{totalErros}</span>
                          </div>
                       </div>
                    </>
                 )}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
