import React, { useMemo, useState } from 'react';
import { useEdital } from '../store';
import { differenceInDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, History, BookOpen, AlertCircle, ChevronLeft } from 'lucide-react';

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
  const { editais, pinnedEditalId } = useEdital();
  const [selectedEditalId, setSelectedEditalId] = useState<string>(pinnedEditalId || 'all');
  const [selectedMateriaId, setSelectedMateriaId] = useState<string | null>(null);

  React.useEffect(() => {
    if (pinnedEditalId) {
      setSelectedEditalId(pinnedEditalId);
    }
  }, [pinnedEditalId]);

  const sugestoes: Sugestao[] = useMemo(() => {
    let list: Sugestao[] = [];
    const filteredEditais = selectedEditalId === 'all' ? editais : editais.filter(e => e.id === selectedEditalId);
    
    filteredEditais.forEach(edital => {
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
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto custom-scrollbar">
      <header className="px-8 py-8 md:py-12 max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                 <History className="w-4 h-4" />
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">Revisão Inteligente</h1>
          </div>
          <select 
            value={selectedEditalId} 
            onChange={e => {
              setSelectedEditalId(e.target.value);
              setSelectedMateriaId(null);
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 transition-colors shadow-sm min-w-[200px]"
          >
            <option value="all">Todos os Editais</option>
            {editais.map(e => (
              <option key={e.id} value={e.id}>{e.titulo || 'Edital sem título'}</option>
            ))}
          </select>
        </div>
        <p className="text-slate-500 font-medium">Tópicos priorizados por menor número de revisões e mais tempo sem estudar.</p>
      </header>

      <main className="px-4 md:px-8 pb-32 max-w-5xl mx-auto w-full">
        {sugestoesPorMateria.length === 0 ? (
           <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
               <AlertCircle className="w-8 h-8 text-slate-400" />
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhum estudo registrado</h3>
             <p className="text-slate-500 max-w-md mx-auto">Marque tópicos como "estudados" para acompanharmos o tempo desde a última revisão.</p>
           </div>
        ) : selectedMateriaId && sugestoesPorMateria.some(g => g.materiaId === selectedMateriaId) ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setSelectedMateriaId(null)} 
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-600 shadow-sm"
              >
                <ChevronLeft className="w-5 h-5"/>
              </button>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">{sugestoesPorMateria.find(g => g.materiaId === selectedMateriaId)?.materiaNome}</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{sugestoesPorMateria.find(g => g.materiaId === selectedMateriaId)?.editalTitulo}</p>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100">
                {sugestoesPorMateria.find(g => g.materiaId === selectedMateriaId)?.itens.map((item, iIdx) => (
                  <div key={iIdx} className="px-8 py-5 flex sm:items-center justify-between gap-4 flex-col sm:flex-row hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-800">{item.tituloItem}</h3>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <span className="text-[11px] font-bold text-slate-600">{item.revisoes_concluidas} <span className="text-[9px] uppercase tracking-wider text-slate-400">Revisões</span></span>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm ${item.diasSemEstudar > 15 ? 'bg-rose-50 text-rose-600 border-rose-100' : item.diasSemEstudar > 7 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">
                          Há {item.diasSemEstudar} dia{item.diasSemEstudar !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sugestoesPorMateria.map((grupo, idx) => {
              const maxAtraso = Math.max(...grupo.itens.map(i => i.diasSemEstudar));
              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedMateriaId(grupo.materiaId)}
                  className="bg-white border border-slate-200 rounded-[2.5rem] p-6 cursor-pointer hover:border-blue-900/30 hover:shadow-xl transition-all flex flex-col justify-between aspect-square group relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16 rounded-full opacity-20 ${maxAtraso > 15 ? 'bg-rose-500' : maxAtraso > 7 ? 'bg-amber-500' : 'bg-blue-900'}`}></div>
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-900 group-hover:border-blue-100 transition-all">
                      <BookOpen className="w-6 h-6"/>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                      {grupo.itens.length} tópicos
                    </span>
                  </div>

                  <div className="relative z-10">
                    <div className="mb-3 flex flex-wrap gap-2">
                       {maxAtraso > 15 && (
                         <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-rose-50 text-rose-600 text-[9px] font-bold uppercase tracking-wider rounded-lg border border-rose-100">
                            <AlertCircle className="w-3 h-3" />
                            Alerta Crítico
                         </span>
                       )}
                       <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-500 text-[9px] font-bold uppercase tracking-wider rounded-lg border border-slate-200">
                          {grupo.editalTitulo.split(' ')[0]}
                       </span>
                    </div>
                    <h3 className="font-display font-bold text-slate-900 text-lg leading-tight group-hover:text-blue-900 transition-colors line-clamp-2">{grupo.materiaNome}</h3>
                    <div className="mt-4 flex items-center gap-2 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium tracking-tight">Máx. {maxAtraso} dias</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
