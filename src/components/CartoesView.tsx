import React, { useState } from "react";
import { useEdital } from "../store";
import { Sparkles, Trash2, Library, BookOpen, Layers, X, Info } from "lucide-react";

export function CartoesView() {
  const { editais, updateCartoes } = useEdital();
  const [textoColado, setTextoColado] = useState("");
  const [selectedEdital, setSelectedEdital] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedMateria, setSelectedMateria] = useState("");
  const [selectedTopico, setSelectedTopico] = useState("");
  const [selectedSubtopico, setSelectedSubtopico] = useState("");
  
  const [parsedCards, setParsedCards] = useState<{pergunta: string, resposta: string}[]>([]);

  const handleParse = () => {
    if (!textoColado.trim()) return;
    const lines = textoColado.split('\n');
    const cards: {pergunta: string, resposta: string}[] = [];
    
    lines.forEach(l => {
      if (l.trim()) {
        const parts = l.split(';');
        if (parts.length >= 2) {
          cards.push({ pergunta: parts[0].trim(), resposta: parts.slice(1).join(';').trim() });
        } else {
           cards.push({ pergunta: l.trim(), resposta: "-" });
        }
      }
    });
    setParsedCards(cards);
  };

  const handleSave = () => {
    if (!selectedEdital || !selectedArea || !selectedMateria || !selectedTopico) {
       alert("Selecione onde salvar os cartões!");
       return;
    }
    
    if (parsedCards.length === 0) return;

    const edital = editais.find(e => e.id === selectedEdital);
    const area = edital?.areas.find(a => a.id === selectedArea);
    const materia = area?.materias.find(m => m.id === selectedMateria);
    const topico = materia?.topicos.find(t => t.id === selectedTopico);
    
    let currentCartoes: any[] = [];
    if (topico) {
       if (selectedSubtopico) {
          const s = topico.subtopicos.find(sub => sub.id === selectedSubtopico);
          if (s) currentCartoes = s.cartoes || [];
       } else {
          currentCartoes = topico.cartoes || [];
       }
    }

    const novosCartoes = parsedCards.map(c => ({ id: Math.random().toString(36).substring(7), ...c }));
    
    updateCartoes(selectedEdital, selectedArea, selectedMateria, selectedTopico, selectedSubtopico || undefined, [...currentCartoes, ...novosCartoes]);
    
    setTextoColado("");
    setParsedCards([]);
    alert("Cartões salvos com sucesso!");
  };

  const editalObj = editais.find(e => e.id === selectedEdital);
  const areaObj = editalObj?.areas.find(a => a.id === selectedArea);
  const materiaObj = areaObj?.materias.find(m => m.id === selectedMateria);
  const topicoObj = materiaObj?.topicos.find(t => t.id === selectedTopico);

  return (
    <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto p-4 sm:p-6 bg-slate-50 relative pb-24">
      <div className="flex flex-col mb-8 pt-4">
         <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">Importar Cartões</h2>
         <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Crie dezenas de cartões de uma vez colando seu texto</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Lado Esquerdo - Importação */}
         <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-1">
               <div className="flex items-start gap-3 mb-4">
                  <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                     <Info className="w-5 h-5"/>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Formato Esperado</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">
                      Você pode gerar os cartões colando o texto onde a <span className="font-bold text-slate-700">Pergunta</span> e a <span className="font-bold text-slate-700">Resposta</span> estão separadas por <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-bold">;</span> (ponto e vírgula).
                    </p>
                  </div>
               </div>

               <div className="mb-4">
                  <textarea 
                     value={textoColado}
                     onChange={(e) => setTextoColado(e.target.value)}
                     className="w-full h-64 p-4 text-sm font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition-all placeholder:text-slate-400"
                     placeholder="Exemplo:&#10;Qual a capital do Brasil?;Brasília&#10;Quem descobriu o Brasil?;Pedro Álvares Cabral&#10;O que é um ato administrativo?;É a declaração do Estado..."
                  />
               </div>
               
               <button 
                  onClick={handleParse} 
                  disabled={!textoColado.trim()}
                  className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex justify-center items-center gap-2 uppercase tracking-widest"
               >
                  <Sparkles className="w-4 h-4"/> 
                  Gerar Cartões (Preview)
               </button>
            </div>
         </div>

         {/* Lado Direito - Destino e Preview */}
         <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col h-[70vh]">
               <h3 className="font-bold text-slate-900 mb-4 block">1. Selecione o Destino</h3>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 shrink-0">
                  <select 
                     value={selectedEdital} 
                     onChange={(e) => { setSelectedEdital(e.target.value); setSelectedArea(""); setSelectedMateria(""); setSelectedTopico(""); setSelectedSubtopico(""); }}
                     className="p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-300"
                  >
                     <option value="">Selecione o Edital...</option>
                     {editais.map(e => <option key={e.id} value={e.id}>{e.titulo}</option>)}
                  </select>

                  <select 
                     value={selectedArea} 
                     onChange={(e) => { setSelectedArea(e.target.value); setSelectedMateria(""); setSelectedTopico(""); setSelectedSubtopico(""); }}
                     className="p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-300 disabled:opacity-50"
                     disabled={!selectedEdital}
                  >
                     <option value="">Selecione a Área...</option>
                     {editalObj?.areas.map(a => <option key={a.id} value={a.id}>{a.area}</option>)}
                  </select>

                  <select 
                     value={selectedMateria} 
                     onChange={(e) => { setSelectedMateria(e.target.value); setSelectedTopico(""); setSelectedSubtopico(""); }}
                     className="p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-300 disabled:opacity-50"
                     disabled={!selectedArea}
                  >
                     <option value="">Selecione a Matéria...</option>
                     {areaObj?.materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>

                  <select 
                     value={selectedTopico} 
                     onChange={(e) => { setSelectedTopico(e.target.value); setSelectedSubtopico(""); }}
                     className="p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-300 disabled:opacity-50"
                     disabled={!selectedMateria}
                  >
                     <option value="">Selecione o Tópico...</option>
                     {materiaObj?.topicos.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                  </select>
                  
                  {topicoObj && topicoObj.subtopicos.length > 0 && (
                     <select 
                        value={selectedSubtopico} 
                        onChange={(e) => setSelectedSubtopico(e.target.value)}
                        className="p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-300 sm:col-span-2"
                     >
                        <option value="">Nenhum Subtópico (Salvar no Tópico Principal)</option>
                        {topicoObj.subtopicos.map(st => <option key={st.id} value={st.id}>{st.titulo}</option>)}
                     </select>
                  )}
               </div>

               <h3 className="font-bold text-slate-900 mb-2 mt-4 pt-4 border-t border-slate-100 flex justify-between items-center shrink-0">
                  <span>2. Preview e Edição</span>
                  {parsedCards.length > 0 && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">{parsedCards.length} cartões</span>}
               </h3>
               
               <div className="flex-1 overflow-y-auto mb-4 border border-slate-200 bg-slate-50 rounded-2xl p-2 hide-scrollbar">
                  {parsedCards.length === 0 ? (
                     <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                         Gere os cartões à esquerda para visualizar aqui
                     </div>
                  ) : (
                     <div className="flex flex-col gap-3">
                        {parsedCards.map((c, idx) => (
                           <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 relative group">
                              <button onClick={() => setParsedCards(parsedCards.filter((_, i) => i !== idx))} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Trash2 className="w-4 h-4"/>
                              </button>
                              <div className="mb-2">
                                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest block mb-0.5">Pergunta</span>
                                <input value={c.pergunta} onChange={(e) => {
                                   const nc = [...parsedCards];
                                   nc[idx].pergunta = e.target.value;
                                   setParsedCards(nc);
                                }} className="w-full text-xs font-medium text-slate-900 outline-none border-b border-transparent focus:border-indigo-200"/>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block mb-0.5">Resposta</span>
                                <input value={c.resposta} onChange={(e) => {
                                   const nc = [...parsedCards];
                                   nc[idx].resposta = e.target.value;
                                   setParsedCards(nc);
                                }} className="w-full text-xs text-slate-600 outline-none border-b border-transparent focus:border-emerald-200"/>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               <button 
                  onClick={handleSave} 
                  disabled={parsedCards.length === 0 || !selectedTopico}
                  className="w-full px-6 py-3 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-900/20 uppercase tracking-widest shrink-0"
               >
                  Salvar Cartões
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
