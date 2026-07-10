import React, { useMemo } from 'react';
import { useEdital } from '../store';
import { differenceInDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, History, BookOpen, AlertCircle } from 'lucide-react';

interface Sugestao {
  editalId: string;
  editalTitulo: string;
  areaId: string;
  materiaId: string;
  materiaNome: string;
  topicoOuSubId: string;
  tituloItem: string;
  dataEstudo: string;
  diasSemEstudar: number;
  revisoes_concluidas: number;
}

export function RevisaoSugestoes() {
  const { editais } = useEdital();

  const sugestoes: Sugestao[] = useMemo(() => {
    let list: Sugestao[] = [];
    editais.forEach(edital => {
      (edital?.areas || []).forEach(area => {
        (area?.materias || []).forEach(materia => {
          (materia?.topicos || []).forEach(topico => {
            if (topico.data_estudo) {
              list.push({
                editalId: edital.id,
                editalTitulo: edital.titulo,
                areaId: area.id,
                materiaId: materia.id,
                materiaNome: materia.nome,
                topicoOuSubId: topico.id,
                tituloItem: topico.titulo,
                dataEstudo: topico.data_estudo,
                diasSemEstudar: Math.abs(differenceInDays(new Date(), parseISO(topico.data_estudo))),
                revisoes_concluidas: topico.revisoes_concluidas || 0
              });
            }
            (topico?.subtopicos || []).forEach(sub => {
              if (sub.data_estudo) {
                list.push({
                  editalId: edital.id,
                  editalTitulo: edital.titulo,
                  areaId: area.id,
                  materiaId: materia.id,
                  materiaNome: materia.nome,
                  topicoOuSubId: sub.id,
                  tituloItem: sub.titulo,
                  dataEstudo: sub.data_estudo,
                  diasSemEstudar: Math.abs(differenceInDays(new Date(), parseISO(sub.data_estudo))),
                  revisoes_concluidas: sub.revisoes_concluidas || 0
                });
              }
            });
          });
        });
      });
    });

    // Sort by least reviewed, then most days without studying
    list.sort((a, b) => {
      if (a.revisoes_concluidas !== b.revisoes_concluidas) {
        return a.revisoes_concluidas - b.revisoes_concluidas;
      }
      return b.diasSemEstudar - a.diasSemEstudar;
    });
    return list;
  }, [editais]);

  // Group by materia for display
  const sugestoesPorMateria = useMemo(() => {
    const grouped = sugestoes.reduce((acc, curr) => {
      if (!acc[curr.materiaId]) acc[curr.materiaId] = { materiaNome: curr.materiaNome, editalTitulo: curr.editalTitulo, itens: [] };
      acc[curr.materiaId].itens.push(curr);
      return acc;
    }, {} as Record<string, { materiaNome: string, editalTitulo: string, itens: Sugestao[] }>);
    
    // Sort matters by the highest diasSemEstudar of its items
    return Object.values(grouped).sort((a, b) => {
      // Find minimum reviews for each group and sort by it
      const minA = Math.min(...a.itens.map(i => i.revisoes_concluidas));
      const minB = Math.min(...b.itens.map(i => i.revisoes_concluidas));
      if (minA !== minB) return minA - minB;
      
      return Math.max(...b.itens.map(i => i.diasSemEstudar)) - Math.max(...a.itens.map(i => i.diasSemEstudar));
    });
  }, [sugestoes]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
      <header className="px-8 py-8 md:py-12 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
               <History className="w-4 h-4" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">Revisão Inteligente</h1>
        </div>
        <p className="text-slate-500 font-medium">Tópicos priorizados por menor número de revisões e mais tempo sem estudar.</p>
      </header>

      <main className="px-4 md:px-8 pb-32 max-w-4xl mx-auto w-full">
        {sugestoesPorMateria.length === 0 ? (
           <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
               <AlertCircle className="w-8 h-8 text-slate-400" />
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhum estudo registrado</h3>
             <p className="text-slate-500 max-w-md mx-auto">Marque tópicos como "estudados" para acompanharmos o tempo desde a última revisão.</p>
           </div>
        ) : (
          <div className="space-y-8">
             {sugestoesPorMateria.map((grupo, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                   <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 rounded-lg bg-blue-900/10 text-blue-800 flex items-center justify-center shrink-0">
                            <BookOpen className="w-3.5 h-3.5" />
                         </div>
                         <h2 className="font-bold text-slate-800">{grupo.materiaNome}</h2>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 self-start sm:self-auto">
                         {grupo.editalTitulo}
                      </span>
                   </div>
                   <div className="divide-y divide-slate-100">
                      {grupo.itens.map((item, iIdx) => (
                         <div key={iIdx} className="px-6 py-4 flex sm:items-center justify-between gap-4 flex-col sm:flex-row hover:bg-slate-50 transition-colors">
                            <div className="flex-1">
                               <h3 className="text-sm font-medium text-slate-700">{item.tituloItem}</h3>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                               <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 bg-white">
                                  <span className="text-xs font-bold text-slate-500">{item.revisoes_concluidas} <span className="font-medium text-[10px] uppercase tracking-widest text-slate-400">Revisões</span></span>
                               </div>
                               <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${item.diasSemEstudar > 15 ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : item.diasSemEstudar > 7 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                 <Clock className="w-3.5 h-3.5" />
                                 <span className="text-xs font-bold">
                                    Há {item.diasSemEstudar} dia{item.diasSemEstudar !== 1 ? 's' : ''}
                                 </span>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             ))}
          </div>
        )}
      </main>
    </div>
  );
}
