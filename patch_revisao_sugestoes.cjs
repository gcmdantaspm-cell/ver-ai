const fs = require('fs');
let content = fs.readFileSync('src/components/RevisaoSugestoes.tsx', 'utf-8');

// 1. Imports
content = content.replace(/import {([^}]+)} from "lucide-react";/, 'import { $1, Layers, Trash2, Sparkles, Loader2, X } from "lucide-react";');
if (!content.includes('generateFlashcards')) {
  content = content.replace(/import \{ useEdital \} from '\.\.\/store';/, "import { useEdital } from '../store';\nimport { generateFlashcards } from '../services/ai';\nimport { Cartao } from '../types';");
}

// 2. Interface Sugestao
content = content.replace(/revisoes_concluidas: number;\n}/, 'revisoes_concluidas: number;\n  topicoId: string;\n  subtopicoId?: string;\n  cartoes: Cartao[];\n}');

// 3. Populate list.push
content = content.replace(/revisoes_concluidas: topico\.revisoes_concluidas \|\| 0\n\s+\}\);/, 'revisoes_concluidas: topico.revisoes_concluidas || 0,\n                topicoId: topico.id,\n                cartoes: topico.cartoes || []\n              });');

content = content.replace(/revisoes_concluidas: sub\.revisoes_concluidas \|\| 0\n\s+\}\);/, 'revisoes_concluidas: sub.revisoes_concluidas || 0,\n                  topicoId: topico.id,\n                  subtopicoId: sub.id,\n                  cartoes: sub.cartoes || []\n                });');

// 4. State
content = content.replace(/const \[selectedMateriaId, setSelectedMateriaId\] = useState<string \| null>\(null\);/, `const [selectedMateriaId, setSelectedMateriaId] = useState<string | null>(null);
  const [cartoesModal, setCartoesModal] = useState<{isOpen: boolean, editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string, cartoes: Cartao[], title: string} | null>(null);
  const [cartoesAiLoading, setCartoesAiLoading] = useState(false);
  const [cartoesBaseText, setCartoesBaseText] = useState("");`);

content = content.replace(/const \{ editais, pinnedEditalId, setPinnedEditalId \} = useEdital\(\);/, 'const { editais, pinnedEditalId, setPinnedEditalId, updateCartoes } = useEdital();');

// 5. Handle AI flashcards
const aiFlashcardsFn = `
  const handleGenerateFlashcards = async () => {
    if (!cartoesModal) return;
    setCartoesAiLoading(true);
    try {
       const edital = editais.find(e => e.id === cartoesModal.editalId);
       const area = (edital?.areas || []).find(a => a.id === cartoesModal.areaId);
       const materia = (area?.materias || []).find(m => m.id === cartoesModal.materiaId);
       const topico = (materia?.topicos || []).find(t => t.id === cartoesModal.topicoId);
       const subtopico = cartoesModal.subtopicoId ? (topico?.subtopicos || []).find(s => s.id === cartoesModal.subtopicoId) : undefined;
       const itemName = subtopico ? subtopico.titulo : topico?.titulo;
       
       let promptText = \`Crie cartões de flashcard sobre o assunto "\${itemName}" da matéria "\${materia?.nome}".\`;
       if (cartoesBaseText.trim()) {
           promptText = \`Crie cartões de flashcard sobre o assunto "\${itemName}" da matéria "\${materia?.nome}", baseando-se ESTRITAMENTE no seguinte texto base fornecido:\\n\\n\${cartoesBaseText.trim()}\`;
       }
       
       const generated = await generateFlashcards(promptText);
       setCartoesModal(prev => {
          if(!prev) return prev;
          const merged = [...prev.cartoes];
          generated.forEach(g => {
            if(!merged.find(m => m.pergunta.toLowerCase() === g.pergunta.toLowerCase())) {
               merged.push({ id: Math.random().toString(36).substring(7), ...g });
            }
          });
          return { ...prev, cartoes: merged };
       });
       setCartoesBaseText("");
    } catch (e: any) {
       alert("Erro ao gerar cartões: " + e.message);
    } finally {
       setCartoesAiLoading(false);
    }
  };
`;

content = content.replace(/const sugestoes: Sugestao\[\] = useMemo\(\(\) => \{/, aiFlashcardsFn + '\n  const sugestoes: Sugestao[] = useMemo(() => {');

// 6. Add button to render item
content = content.replace(/<div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">/, `<div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                      <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           setCartoesModal({
                             isOpen: true,
                             editalId: item.editalId,
                             areaId: item.areaId,
                             materiaId: item.materiaId,
                             topicoId: item.topicoId,
                             subtopicoId: item.subtopicoId,
                             cartoes: item.cartoes,
                             title: item.tituloItem
                           });
                         }}
                         className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors shadow-sm"
                      >
                         <Layers className="w-3.5 h-3.5" />
                         <span className="text-[11px] font-bold">Cartões ({item.cartoes.length})</span>
                      </button>`);

// 7. Add Modal JSX
const modalJsx = `
      {cartoesModal?.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-slate-50 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
               <div>
                 <h3 className="text-lg font-display font-bold text-slate-900">Cartões de Estudo (Flashcards)</h3>
                 <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">{cartoesModal.title}</p>
               </div>
               <button onClick={() => setCartoesModal(null)} className="text-slate-500 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-xl transition-all"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-4 bg-slate-50/50 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar flex flex-col gap-4">
                <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm shrink-0">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Gerador Inteligente</span>
                     <span className="text-[10px] text-slate-400">Cole um texto para focar nos cartões gerados</span>
                   </div>
                   <textarea
                       value={cartoesBaseText}
                       onChange={e => setCartoesBaseText(e.target.value)}
                       placeholder="Cole aqui a lei seca, PDF, ou anotações para a IA criar cartões especificamente sobre este texto..."
                       className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none focus:border-indigo-300 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                   />
                </div>

                {cartoesModal.cartoes?.length === 0 ? (
                   <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                      <Sparkles className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="font-medium text-sm">Nenhum cartão gerado ainda.</p>
                      <p className="text-xs text-slate-400 mt-2 max-w-sm">Use a Inteligência Artificial para gerar cartões de memorização (Perguntas e Respostas) baseados no conteúdo deste tópico.</p>
                   </div>
                ) : (
                   <div className="space-y-4">
                      {cartoesModal.cartoes.map((cartao, i) => (
                         <div key={cartao.id || i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group">
                            <button onClick={() => {
                               const newCartoes = cartoesModal.cartoes.filter(c => c.id !== cartao.id);
                               setCartoesModal(prev => prev ? { ...prev, cartoes: newCartoes } : null);
                            }} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                               <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="mb-3">
                               <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1 block">Pergunta</span>
                               <textarea
                                 value={cartao.pergunta}
                                 onChange={(e) => {
                                   const newCartoes = [...cartoesModal.cartoes];
                                   newCartoes[i].pergunta = e.target.value;
                                   setCartoesModal(prev => prev ? { ...prev, cartoes: newCartoes } : null);
                                 }}
                                 className="w-full text-sm font-medium text-slate-900 bg-slate-50 p-3 rounded-xl border border-transparent focus:border-indigo-200 focus:bg-white outline-none resize-none transition-all focus:ring-4 focus:ring-indigo-500/10"
                                 rows={2}
                               />
                            </div>
                            <div>
                               <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 block">Resposta</span>
                               <textarea
                                 value={cartao.resposta}
                                 onChange={(e) => {
                                   const newCartoes = [...cartoesModal.cartoes];
                                   newCartoes[i].resposta = e.target.value;
                                   setCartoesModal(prev => prev ? { ...prev, cartoes: newCartoes } : null);
                                 }}
                                 className="w-full text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-transparent focus:border-emerald-200 focus:bg-white outline-none resize-none transition-all focus:ring-4 focus:ring-emerald-500/10"
                                 rows={3}
                               />
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
             <div className="p-6 border-t border-slate-200 flex justify-between gap-3 bg-white shrink-0">
                <button 
                  onClick={handleGenerateFlashcards} 
                  disabled={cartoesAiLoading}
                  className="px-4 py-2.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-all flex items-center gap-2 uppercase tracking-widest disabled:opacity-50"
                  title="Gerar novos cartões (Flashcards) com IA. Será adicionado ao final da lista atual."
                >
                   {cartoesAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                   {cartoesAiLoading ? "Gerando..." : "Gerar Cartões (IA)"}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => {
                     const novo = { id: Math.random().toString(36).substring(7), pergunta: "", resposta: "" };
                     setCartoesModal(prev => prev ? { ...prev, cartoes: [...prev.cartoes, novo] } : null);
                  }} className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all uppercase tracking-widest hidden sm:block">Adicionar Manual</button>
                  <button onClick={() => setCartoesModal(null)} className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">Cancelar</button>
                  <button onClick={() => { 
                     const finalCartoes = cartoesModal.cartoes.filter(c => c.pergunta.trim() || c.resposta.trim());
                     updateCartoes(cartoesModal.editalId, cartoesModal.areaId, cartoesModal.materiaId, cartoesModal.topicoId, cartoesModal.subtopicoId, finalCartoes); 
                     setCartoesModal(null); 
                  }} className="px-6 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-lg shadow-blue-900/20 transition-all uppercase tracking-widest">Salvar</button>
                </div>
             </div>
           </div>
        </div>
      )}
`;

content = content.replace(/<\/div>\n\s+\)\}\n\s+<\/main>/, '</div>\n        )}\n      </main>\n' + modalJsx);

fs.writeFileSync('src/components/RevisaoSugestoes.tsx', content);
console.log('Patched');
