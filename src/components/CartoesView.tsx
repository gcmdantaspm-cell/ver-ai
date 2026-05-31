import React, { useState, useMemo } from "react";
import { useEdital } from "../store";
import { Sparkles, Trash2, Layers, Info, Plus, Play, CheckCircle2, XCircle, FileText, FilePlus, ChevronRight, ChevronDown, BookOpen, GraduationCap, CornerDownRight, Search, Download } from "lucide-react";
import { isPast, isToday, parseISO } from "date-fns";

export function CartoesView() {
  const { editais, updateCartoes, editCartao, clearCartoes, updateCartaoSM2 } = useEdital();
  const [activeTab, setActiveTab ] = useState<'painel'|'importar'|'manual'>('painel');

  // Para o Dashboard
  const [studySession, setStudySession] = useState<{ cards: any[], currentIndex: number, showAnswer: boolean } | null>(null);
  const [isEditingCartao, setIsEditingCartao] = useState(false);
  const [editPergunta, setEditPergunta] = useState("");
  const [editResposta, setEditResposta] = useState("");
  const [editImagemPergunta, setEditImagemPergunta] = useState("");
  const [editImagemResposta, setEditImagemResposta] = useState("");
  const [editOrigem, setEditOrigem] = useState("");

  // States GERAIS de Destino
  const [selectedEdital, setSelectedEdital] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedMateria, setSelectedMateria] = useState("");
  const [selectedTopico, setSelectedTopico] = useState("");
  const [selectedSubtopico, setSelectedSubtopico] = useState("");

  // States de Importação
  const [textoColado, setTextoColado] = useState("");
  const [parsedCards, setParsedCards] = useState<{pergunta: string, resposta: string}[]>([]);
  
  // States de Conflito
  const [conflictMode, setConflictMode] = useState(false);
  const [safeToImport, setSafeToImport] = useState<{pergunta: string, resposta: string}[]>([]);
  const [importConflicts, setImportConflicts] = useState<{
     imported: {pergunta: string, resposta: string},
     existingId: string,
     existingLocation: {editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string},
     resolution: 'sobrescrever' | 'manter' | 'ignorar' | null
  }[]>([]);

  // Analytics
  const cartoesFrequencies = useMemo(() => {
     const frequenciesBySubject: Record<string, Record<string, number>> = {};

     editais.forEach(ed => {
        ed.areas.forEach(ar => {
           ar.materias.forEach(mat => {
              const subjectName = mat.nome;
              if (!frequenciesBySubject[subjectName]) frequenciesBySubject[subjectName] = {};

              mat.topicos.forEach(top => {
                 if (top.cartoes) {
                     top.cartoes.forEach(c => {
                        const q = c.pergunta.trim().toLowerCase();
                        if (q) frequenciesBySubject[subjectName][q] = (frequenciesBySubject[subjectName][q] || 0) + 1;
                     });
                 }
                 top.subtopicos?.forEach(sub => {
                    const subName = sub.titulo ? `${mat.nome} > ${sub.titulo}` : subjectName;
                    if (!frequenciesBySubject[subName]) frequenciesBySubject[subName] = {};
                    if (sub.cartoes) {
                        sub.cartoes.forEach(c => {
                           const q = c.pergunta.trim().toLowerCase();
                           if (q) frequenciesBySubject[subName][q] = (frequenciesBySubject[subName][q] || 0) + 1;
                        });
                    }
                 });
              });
           });
        });
     });
     
     const result: { assunto: string; ranking: [string, number][] }[] = [];
     for (const [assunto, freq] of Object.entries(frequenciesBySubject)) {
         const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).filter(x => x[1] > 1);
         if (sorted.length > 0) {
             result.push({ assunto, ranking: sorted });
         }
     }
     
     return result.sort((a,b) => b.ranking.length - a.ranking.length);
  }, [editais]);

  // States Manual
  const [perguntaManual, setPerguntaManual] = useState("");
  const [respostaManual, setRespostaManual] = useState("");
  const [imagemPerguntaManual, setImagemPerguntaManual] = useState("");
  const [imagemRespostaManual, setImagemRespostaManual] = useState("");
  const [newAssunto, setNewAssunto] = useState("");
  const [importOrigem, setImportOrigem] = useState("");
  const [manualOrigem, setManualOrigem] = useState("");

  const uniqueOrigens = useMemo(() => {
     const origens = new Set<string>();
     editais.forEach(ed => {
        ed.areas.forEach(ar => {
           ar.materias.forEach(mat => {
              mat.topicos.forEach(top => {
                 if (top.cartoes) top.cartoes.forEach(c => c.origem && origens.add(c.origem));
                 top.subtopicos?.forEach(sub => {
                    if (sub.cartoes) sub.cartoes.forEach(c => c.origem && origens.add(c.origem));
                 });
              });
           });
        });
     });
     return Array.from(origens).sort();
  }, [editais]);

  // Search & Accordion expansions
  const [deckSearch, setDeckSearch] = useState("");
  const [expandedMaterias, setExpandedMaterias] = useState<Record<string, boolean>>({});
  const [expandedTopicos, setExpandedTopicos] = useState<Record<string, boolean>>({});

  // Aggregated Cards Logic
  const allCards = useMemo(() => {
    let cards: any[] = [];
    editais.forEach(e => {
      e.areas.forEach(a => {
        a.materias.forEach(m => {
          m.topicos.forEach(t => {
            if (t.cartoes) t.cartoes.forEach(c => cards.push({ ...c, editalId: e.id, areaId: a.id, materiaId: m.id, topicoId: t.id, editalTitulo: e.titulo, materiaNome: m.nome, topicoTitulo: t.titulo }));
            t.subtopicos.forEach(s => {
              if (s.cartoes) s.cartoes.forEach(c => cards.push({ ...c, editalId: e.id, areaId: a.id, materiaId: m.id, topicoId: t.id, subtopicoId: s.id, editalTitulo: e.titulo, materiaNome: m.nome, topicoTitulo: t.titulo, subtopicoTitulo: s.titulo }));
            });
          });
        });
      });
    });
    return cards;
  }, [editais]);

  // Card count helper to emulate Anki colors (Blue=New, Amber=To Review, Gray=Total)
  const getCardsStats = (cardsList: any[]) => {
    let novos = 0;
    let revisoes = 0;
    cardsList.forEach(c => {
      if (!c.nextReview) {
        novos++;
      } else {
        const d = parseISO(c.nextReview);
        if (isPast(d) || isToday(d)) {
          revisoes++;
        }
      }
    });
    return { novos, revisoes, total: cardsList.length };
  };

  // Group cards hierarchically: Materia -> Topico -> Subtopico (de-duplicated by name)
  const hierarchicalDecks = useMemo(() => {
    const materiaMap = new Map<string, {
      id: string;
      nome: string;
      editalTitulo: string;
      cards: any[];
      topicos: {
        [topicoId: string]: {
          id: string;
          titulo: string;
          cards: any[];
          subtopicos: {
            [subtopicoKey: string]: {
              id?: string;
              titulo: string;
              cards: any[];
            }
          }
        }
      }
    }>();

    allCards.forEach(c => {
      const matKey = `${c.editalId}-${c.materiaId}`;
      if (!materiaMap.has(matKey)) {
        materiaMap.set(matKey, {
          id: matKey,
          nome: c.materiaNome,
          editalTitulo: c.editalTitulo,
          cards: [],
          topicos: {}
        });
      }
      const mDeck = materiaMap.get(matKey)!;
      mDeck.cards.push(c);

      const topId = c.topicoId;
      if (!mDeck.topicos[topId]) {
        mDeck.topicos[topId] = {
          id: topId,
          titulo: c.topicoTitulo,
          cards: [],
          subtopicos: {}
        };
      }
      const tDeck = mDeck.topicos[topId];
      tDeck.cards.push(c);

      // If card belongs to a subtopic, key by trimmed lowercase to deduplicate they
      const subTitle = c.subtopicoTitulo ? c.subtopicoTitulo.trim() : "Geral (Sem assunto)";
      const subKey = subTitle.toLowerCase();
      if (!tDeck.subtopicos[subKey]) {
        tDeck.subtopicos[subKey] = {
          id: c.subtopicoId,
          titulo: subTitle,
          cards: []
        };
      }
      tDeck.subtopicos[subKey].cards.push(c);
    });

    return Array.from(materiaMap.values());
  }, [allCards]);

  const cardsToReview = useMemo(() => {
    return allCards.filter(c => {
      if (!c.nextReview) return true; // new string
      const d = parseISO(c.nextReview);
      return isPast(d) || isToday(d);
    });
  }, [allCards]);

  const newCardsToStudy = useMemo(() => {
    return allCards.filter(c => !c.nextReview);
  }, [allCards]);

  const forecast = useMemo(() => {
    let tomorrow = 0;
    let next7Days = 0;
    let next30Days = 0;
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const tomorrowEnd = new Date(todayEnd);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    
    const d7End = new Date(todayEnd);
    d7End.setDate(d7End.getDate() + 7);
    
    const d30End = new Date(todayEnd);
    d30End.setDate(d30End.getDate() + 30);

    allCards.forEach(c => {
       if (c.nextReview) {
          const d = parseISO(c.nextReview);
          if (d > todayEnd && d <= tomorrowEnd) tomorrow++;
          else if (d > tomorrowEnd && d <= d7End) next7Days++;
          else if (d > d7End && d <= d30End) next30Days++;
       }
    });

    return { tomorrow, next7Days, next30Days };
  }, [allCards]);

  const startStudy = (cardsList: any[], force: boolean = false, onlyNew: boolean = false) => {
    let toStudy = [...cardsList];
    
    if (onlyNew) {
      toStudy = toStudy.filter(c => !c.nextReview);
    } else if (!force) {
      toStudy = toStudy.filter(c => {
        if (!c.nextReview) return true;
        const d = parseISO(c.nextReview);
        return isPast(d) || isToday(d);
      });
    }
    
    if (toStudy.length === 0) {
       alert(onlyNew ? "Não há cartões novos para revisar nesta seleção." : "Nenhum cartão para revisar agora! Você pode fazer a revisão forçada.");
       return;
    }

    const shuffled = toStudy.sort(() => Math.random() - 0.5);
    setStudySession({ cards: shuffled, currentIndex: 0, showAnswer: false });
  };

  const answerCard = (quality: number) => {
    if (!studySession) return;
    const current = studySession.cards[studySession.currentIndex];
    updateCartaoSM2(current.editalId, current.areaId, current.materiaId, current.topicoId, current.subtopicoId, current.id, quality);
    
    const newCards = [...studySession.cards];
    if (quality < 3) {
      newCards.push({ ...current }); // Add back to the end of the queue
    }

    if (studySession.currentIndex + 1 < newCards.length) {
      setStudySession({ cards: newCards, currentIndex: studySession.currentIndex + 1, showAnswer: false });
    } else {
      setStudySession(null); // finished!
    }
  };

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

  const handleSaveImport = () => {
    if (!selectedEdital || !selectedArea || !selectedMateria || !selectedTopico) {
       alert("Selecione onde salvar (Edital, Área, Matéria e Tópico)!"); return;
    }
    if (parsedCards.length === 0) return;

    // Check for duplicates
    const allExisting: {pergunta: string, id: string, location: any}[] = [];
    editais.forEach(ed => {
       ed.areas.forEach(ar => {
          ar.materias.forEach(mat => {
             mat.topicos.forEach(top => {
                if (top.cartoes) top.cartoes.forEach((c:any) => allExisting.push({pergunta: c.pergunta, id: c.id, location: {editalId: ed.id, areaId: ar.id, materiaId: mat.id, topicoId: top.id}}));
                top.subtopicos?.forEach(sub => {
                   if (sub.cartoes) sub.cartoes.forEach((c:any) => allExisting.push({pergunta: c.pergunta, id: c.id, location: {editalId: ed.id, areaId: ar.id, materiaId: mat.id, topicoId: top.id, subtopicoId: sub.id}}));
                });
             });
          });
       });
    });

    const conflicts: typeof importConflicts = [];

    parsedCards.forEach(pc => {
       const pq = pc.pergunta.trim().toLowerCase();
       const ex = allExisting.find(e => e.pergunta.trim().toLowerCase() === pq);
       if (ex) {
          conflicts.push({
             imported: pc,
             existingId: ex.id,
             existingLocation: ex.location,
             resolution: null
          });
       }
    });

    const cardsToSave = parsedCards.map(c => ({
       ...c,
       origem: importOrigem.trim() || undefined
    }));

    saveToDestination(cardsToSave);

    if (conflicts.length > 0) {
       setImportConflicts(conflicts);
       setConflictMode(true);
    } else {
       finishImport();
    }
  };

  const finishImport = () => {
     setTextoColado("");
     setParsedCards([]);
     setConflictMode(false);
     setImportConflicts([]);
     setSafeToImport([]);
     setImportOrigem("");
     alert("Importação concluída!");
  };

  const handleDeleteDeck = (level: 'materia' | 'topico' | 'subtopico', target: any) => {
     if (target.cards.length === 0) return;
     const sample = target.cards[0];
     if (confirm(`Tem certeza que deseja apagar TODOS os ${target.cards.length} cartões deste ${level}?`)) {
        if (level === 'materia') clearCartoes(sample.editalId, sample.areaId, sample.materiaId);
        if (level === 'topico') clearCartoes(sample.editalId, sample.areaId, sample.materiaId, sample.topicoId);
        if (level === 'subtopico') clearCartoes(sample.editalId, sample.areaId, sample.materiaId, sample.topicoId, sample.subtopicoId);
     }
  };

  const handleExportAnki = (target: any, defaultName: string) => {
     if (!target || !target.cards || target.cards.length === 0) {
        alert("Não há cartões para exportar.");
        return;
     }
     
     let csvContent = "";
     
     target.cards.forEach((card: any) => {
        const sanitize = (text: string | undefined) => {
           if (!text) return '""';
           let t = text.replace(/"/g, '""');
           // Retain newlines, but wrap entirely in quotes
           return `"${t}"`;
        };
        
        // Front
        let frente = card.pergunta || "";
        if (card.imagemPergunta) {
           frente += `<br><img src='${card.imagemPergunta}'>`;
        }
        
        // Back
        let verso = card.resposta || "";
        if (card.imagemResposta) {
           verso += `<br><img src='${card.imagemResposta}'>`;
        }
        
        csvContent += `${sanitize(frente)};${sanitize(verso)}\n`;
     });
     
     // BOM for UTF-8
     const blob = new Blob(["\uFEFF"+csvContent], { type: 'text/csv;charset=utf-8;' });
     const link = document.createElement("a");
     const url = URL.createObjectURL(blob);
     link.setAttribute("href", url);
     
     const fileName = `${defaultName.replace(/\s+/g, '_')}_anki.csv`;
     link.setAttribute("download", fileName);
     link.style.visibility = 'hidden';
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const handleImagePaste = (e: React.ClipboardEvent, setImageState: (val: string) => void) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            e.preventDefault();
            const file = items[i].getAsFile();
            if (!file) continue;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 800;
                    
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                    setImageState(dataUrl);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
            break; 
        }
    }
  };

  const handleSaveManual = () => {
    if (!selectedEdital || !selectedArea || !selectedMateria || !selectedTopico) {
       alert("Selecione onde salvar (Edital, Área, Matéria e Tópico)!"); return;
    }
    if (!perguntaManual.trim() || !respostaManual.trim()) {
       alert("Preencha a pergunta e a resposta!"); return;
    }

    saveToDestination([{ 
       pergunta: perguntaManual, 
       resposta: respostaManual, 
       imagemPergunta: imagemPerguntaManual, 
       imagemResposta: imagemRespostaManual,
       origem: manualOrigem.trim() || undefined
    }]);
    setPerguntaManual("");
    setRespostaManual("");
    setImagemPerguntaManual("");
    setImagemRespostaManual("");
    setManualOrigem("");
    alert("Cartão salvo com sucesso!");
  };

  const saveToDestination = (newCardsData: {pergunta: string, resposta: string, imagemPergunta?: string, imagemResposta?: string, origem?: string}[]) => {
    const edital = editais.find(e => e.id === selectedEdital);
    const area = edital?.areas.find(a => a.id === selectedArea);
    const materia = area?.materias.find(m => m.id === selectedMateria);
    const topico = materia?.topicos.find(t => t.id === selectedTopico);
    
    let currentCartoes: any[] = [];
    if (topico && !newAssunto.trim()) {
       if (selectedSubtopico) {
          const s = topico.subtopicos.find(sub => sub.id === selectedSubtopico);
          if (s) currentCartoes = s.cartoes || [];
       } else {
          currentCartoes = topico.cartoes || [];
       }
    }

    const novosCartoes = newCardsData.map(c => ({ id: Math.random().toString(36).substring(7), ...c }));
    updateCartoes(selectedEdital, selectedArea, selectedMateria, selectedTopico, selectedSubtopico || undefined, [...currentCartoes, ...novosCartoes], newAssunto.trim() ? newAssunto.trim() : undefined);
    
    if (newAssunto.trim()) {
       setNewAssunto(""); // Reset for next entries
    }
  }

  const editalObj = editais.find(e => e.id === selectedEdital);
  const areaObj = editalObj?.areas.find(a => a.id === selectedArea);
  const materiaObj = areaObj?.materias.find(m => m.id === selectedMateria);
  const topicoObj = materiaObj?.topicos.find(t => t.id === selectedTopico);

  if (studySession) {
    const card = studySession.cards[studySession.currentIndex];
    const progress = Math.round((studySession.currentIndex / studySession.cards.length) * 100);

    return (
      <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto p-4 sm:p-6 bg-slate-50 flex flex-col h-full">
         <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Revisão de Cartões</span>
               <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded-md">{studySession.currentIndex + 1} de {studySession.cards.length}</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
               <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
         </div>

         <div className="flex-1 flex flex-col items-center justify-center py-4">
            <div className="w-full bg-white p-8 sm:p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 min-h-[55vh] flex flex-col text-center transition-all relative group/card">
               {!isEditingCartao && (
                 <button onClick={() => {
                    setEditPergunta(card.pergunta);
                    setEditResposta(card.resposta);
                    setEditImagemPergunta(card.imagemPergunta || "");
                    setEditImagemResposta(card.imagemResposta || "");
                    setEditOrigem(card.origem || "");
                    setIsEditingCartao(true);
                 }} className="absolute top-6 right-6 text-[10px] uppercase font-bold text-slate-300 hover:text-indigo-600 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100 transition-all overflow-hidden flex items-center justify-center opacity-0 group-hover/card:opacity-100 focus:opacity-100 cursor-pointer shadow-sm">
                    <span>Editar Cartão</span>
                 </button>
               )}

               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 pb-4 border-b border-slate-100/60 inline-block w-fit mx-auto px-6">
                  {card.editalTitulo} <span className="text-slate-300 mx-1">&bull;</span> {card.materiaNome} <span className="text-slate-300 mx-1">&bull;</span> {card.topicoTitulo} {card.subtopicoTitulo ? ( <><span className="text-slate-300 mx-1">&bull;</span> {card.subtopicoTitulo}</>) : ''}
                  {card.origem && <><span className="text-slate-300 mx-1">&bull;</span> <span className="text-amber-500">{card.origem}</span></>}
               </div>
               
               {isEditingCartao ? (
                 <div className="flex-1 flex flex-col justify-center gap-4 text-left max-w-2xl mx-auto w-full">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest -mb-2">Editar Frente (Pergunta)</span>
                    <textarea value={editPergunta} onChange={e => setEditPergunta(e.target.value)} onPaste={(e) => handleImagePaste(e, setEditImagemPergunta)} className="w-full p-4 text-sm border-2 border-slate-100 bg-slate-50 rounded-2xl focus:border-indigo-300 focus:bg-white transition-all outline-none" rows={3}/>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest -mb-2">Imagem da Pergunta (URL)</span>
                    <input value={editImagemPergunta} onChange={e => setEditImagemPergunta(e.target.value)} className="w-full p-3 text-xs border-2 border-slate-100 bg-slate-50 rounded-xl focus:border-indigo-300 focus:bg-white transition-all outline-none" placeholder="Opcional. Ex: https://.../img.jpg" />

                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-6 -mb-2">Editar Verso (Resposta)</span>
                    <textarea value={editResposta} onChange={e => setEditResposta(e.target.value)} onPaste={(e) => handleImagePaste(e, setEditImagemResposta)} className="w-full p-4 text-sm border-2 border-slate-100 bg-slate-50 rounded-2xl focus:border-emerald-300 focus:bg-white transition-all outline-none" rows={5}/>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest -mb-2">Imagem da Resposta (URL)</span>
                    <input value={editImagemResposta} onChange={e => setEditImagemResposta(e.target.value)} className="w-full p-3 text-xs border-2 border-slate-100 bg-slate-50 rounded-xl focus:border-emerald-300 focus:bg-white transition-all outline-none" placeholder="Opcional. Ex: https://.../img.jpg" />
                    
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-6 -mb-2">Origem (Prova/Concurso)</span>
                    <input value={editOrigem} onChange={e => setEditOrigem(e.target.value)} list="unique-origens" className="w-full p-3 text-xs border-2 border-slate-100 bg-slate-50 rounded-xl focus:border-amber-300 focus:bg-white transition-all outline-none" placeholder="Opcional." />
                    
                    <div className="flex gap-3 justify-end mt-6">
                       <button onClick={() => setIsEditingCartao(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all uppercase tracking-widest">Cancelar</button>
                       <button onClick={() => {
                          editCartao(card.editalId, card.areaId, card.materiaId, card.topicoId, card.subtopicoId, card.id, editPergunta, editResposta, editImagemPergunta.trim() || undefined, editImagemResposta.trim() || undefined, editOrigem.trim() || undefined);
                          setIsEditingCartao(false);
                          
                          // Update studySession inline for visual preview
                          const newCards = [...studySession.cards];
                          newCards[studySession.currentIndex] = { ...card, pergunta: editPergunta, resposta: editResposta, imagemPergunta: editImagemPergunta.trim() || undefined, imagemResposta: editImagemResposta.trim() || undefined, origem: editOrigem.trim() || undefined };
                          setStudySession({ ...studySession, cards: newCards });
                       }} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 text-white text-xs font-bold rounded-xl transition-all uppercase tracking-widest">Salvar Modificações</button>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col justify-center gap-10">
                    <div>
                      {card.imagemPergunta && <img src={card.imagemPergunta} alt="Pergunta" className="max-h-72 object-contain mx-auto mb-8 rounded-2xl shadow-sm border border-slate-100" />}
                      <h3 className="text-3xl font-bold text-slate-800 leading-tight whitespace-pre-wrap max-w-4xl mx-auto">{card.pergunta}</h3>
                    </div>

                    {studySession.showAnswer ? (
                      <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 border-t-2 border-dashed border-slate-200 pt-10 mt-6 relative before:absolute before:top-[-10px] before:left-1/2 before:-translate-x-1/2 before:w-16 before:h-2 before:bg-white">
                        {card.imagemResposta && <img src={card.imagemResposta} alt="Resposta" className="max-h-72 object-contain mx-auto mb-8 rounded-2xl shadow-sm border border-slate-100" />}
                        <p className="text-xl text-slate-700 font-medium whitespace-pre-wrap max-w-4xl mx-auto leading-relaxed">{card.resposta}</p>
                      </div>
                    ) : (
                      <div className="mt-12">
                         <button onClick={() => setStudySession({ ...studySession, showAnswer: true })} className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-[0_8px_15px_rgb(0,0,0,0.1)] hover:shadow-[0_15px_25px_rgb(0,0,0,0.15)] hover:-translate-y-1 transition-all uppercase tracking-[0.2em] text-xs">
                            Mostrar Resposta
                         </button>
                      </div>
                    )}
                 </div>
               )}
            </div>
         </div>

         {studySession.showAnswer && !isEditingCartao && (
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <button onClick={() => answerCard(0)} className="p-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl transition-all flex flex-col items-center gap-1 border border-rose-200 shadow-sm">
                <span className="text-sm">Errei</span>
                <span className="text-[10px] uppercase opacity-70">Novamente</span>
             </button>
             <button onClick={() => answerCard(3)} className="p-4 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-2xl transition-all flex flex-col items-center gap-1 border border-orange-200 shadow-sm">
                <span className="text-sm">Difícil</span>
                <span className="text-[10px] uppercase opacity-70">Em breve</span>
             </button>
             <button onClick={() => answerCard(4)} className="p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-2xl transition-all flex flex-col items-center gap-1 border border-emerald-200 shadow-sm">
                <span className="text-sm">Bom</span>
                <span className="text-[10px] uppercase opacity-70">Amanhã</span>
             </button>
             <button onClick={() => answerCard(5)} className="p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-2xl transition-all flex flex-col items-center gap-1 border border-blue-200 shadow-sm">
                <span className="text-sm">Fácil</span>
                <span className="text-[10px] uppercase opacity-70">+ Dias</span>
             </button>
           </div>
         )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto p-4 sm:p-6 bg-slate-50 relative pb-24 h-full flex flex-col">
      <datalist id="unique-origens">
         {uniqueOrigens.map((origem, idx) => (
             <option key={idx} value={origem} />
         ))}
      </datalist>
      <div className="flex flex-col mb-8 pt-4 shrink-0">
         <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">Cartões Inteligentes</h2>
         <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Crie e revise flashcards com repetição espaçada</p>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto hide-scrollbar shrink-0">
         <button onClick={() => setActiveTab('painel')} className={`px-4 py-2 font-bold text-sm rounded-xl transition-all ${activeTab === 'painel' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>Painel Principal</button>
         <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 font-bold text-sm rounded-xl transition-all flex items-center gap-2 ${activeTab === 'manual' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}><FilePlus className="w-4 h-4"/> Criar Manual</button>
         <button onClick={() => setActiveTab('importar')} className={`px-4 py-2 font-bold text-sm rounded-xl transition-all flex items-center gap-2 ${activeTab === 'importar' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}><FileText className="w-4 h-4"/> Importar em Lote</button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'painel' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div>
                      <h3 className="font-bold text-slate-900 text-lg">Seus Baralhos Inteligentes</h3>
                      <p className="text-xs text-slate-500 font-semibold">Estrutura organizada por Matéria › Tópico › Assunto</p>
                   </div>
                   {/* Search input to easily find topics/subjects */}
                   <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                         type="text"
                         value={deckSearch}
                         onChange={(e) => setDeckSearch(e.target.value)}
                         placeholder="Buscar baralho..."
                         className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-300 focus:bg-white transition-all placeholder:text-slate-400"
                      />
                   </div>
                </div>

                {(() => {
                   // Search Filter Logic
                   const filteredDecks = !deckSearch.trim() ? hierarchicalDecks : hierarchicalDecks.map(m => {
                      const matchedTopicos: typeof m.topicos = {};
                      Object.keys(m.topicos).forEach(topId => {
                        const t = m.topicos[topId];
                        const matchTitle = t.titulo.toLowerCase().includes(deckSearch.toLowerCase().trim());
                        
                        const matchedSubtopicos: typeof t.subtopicos = {};
                        Object.keys(t.subtopicos).forEach(subKey => {
                          const s = t.subtopicos[subKey];
                          if (matchTitle || s.titulo.toLowerCase().includes(deckSearch.toLowerCase().trim())) {
                            matchedSubtopicos[subKey] = s;
                          }
                        });

                        if (matchTitle || Object.keys(matchedSubtopicos).length > 0 || m.nome.toLowerCase().includes(deckSearch.toLowerCase().trim())) {
                          matchedTopicos[topId] = {
                            ...t,
                            subtopicos: matchedSubtopicos
                          };
                        }
                      });

                      if (m.nome.toLowerCase().includes(deckSearch.toLowerCase().trim()) || Object.keys(matchedTopicos).length > 0) {
                        return { ...m, topicos: matchedTopicos };
                      }
                      return null;
                   }).filter(Boolean);

                   if (filteredDecks.length === 0) {
                      return (
                         <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 border-dashed text-slate-500 flex flex-col items-center justify-center gap-2">
                            <Layers className="w-12 h-12 text-slate-300" />
                            <p className="font-bold text-sm text-slate-700">Nenhum baralho encontrado</p>
                            <p className="text-xs text-slate-400 max-w-sm">Use as guias "Criar Manual" ou "Importar em Lote" no topo para criar cartões associando a um Edital e Matéria.</p>
                         </div>
                      );
                   }

                   return (
                      <div className="space-y-4">
                         {filteredDecks.map(m => {
                            if (!m) return null;
                            const mStats = getCardsStats(m.cards);
                            const isMatExpanded = expandedMaterias[m.id] || !!deckSearch;
                            return (
                               <div key={m.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 hover:border-slate-300 animate-in fade-in duration-200">
                                  {/* Matéria Root Row */}
                                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 border-b border-slate-150">
                                     <div className="flex items-center gap-3">
                                        <button 
                                           onClick={() => setExpandedMaterias(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                                           className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
                                        >
                                           {isMatExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>
                                        <div className="bg-indigo-100 p-2 rounded-xl text-indigo-700 shrink-0">
                                           <BookOpen className="w-4 h-4" />
                                        </div>
                                        <div>
                                           <div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">{m.editalTitulo}</div>
                                           <h4 className="font-bold text-slate-800 text-sm leading-tight">{m.nome}</h4>
                                        </div>
                                     </div>

                                     <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0 ml-10 sm:ml-0">
                                        <div className="flex items-center gap-2">
                                           {mStats.novos > 0 && (
                                              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100" title="Novos cartões">
                                                 {mStats.novos} N
                                              </span>
                                           )}
                                           {mStats.revisoes > 0 ? (
                                              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md border border-amber-100" title="Para revisar hoje">
                                                 {mStats.revisoes} R
                                              </span>
                                           ) : (
                                              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md" title="Revisado">
                                                 Ok
                                              </span>
                                           )}
                                           <span className="text-[10px] font-semibold text-slate-400">({mStats.total})</span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                           <button onClick={() => handleExportAnki(m, m.materiaNome)} className="px-2 py-1.5 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all cursor-pointer mr-0.5" title="Exportar para Anki (.csv)"><Download className="w-3.5 h-3.5" /></button>
                                           <button onClick={() => handleDeleteDeck('materia', m)} className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-all cursor-pointer mr-0.5" title="Apagar todos cartões desta matéria"><Trash2 className="w-3.5 h-3.5" /></button>
                                           <button 
                                              onClick={() => startStudy(m.cards, false)} 
                                              disabled={mStats.revisoes + mStats.novos === 0}
                                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-lg text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                                           >
                                              Revisar
                                           </button>
                                           {mStats.novos > 0 && (
                                               <button 
                                                  onClick={() => startStudy(m.cards, false, true)} 
                                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-sm flex items-center gap-1"
                                                  title="Revisar apenas os cartões que nunca foram vistos"
                                               >
                                                  <Sparkles className="w-3 h-3"/> Novos
                                               </button>
                                           )}
                                           <button 
                                              onClick={() => startStudy(m.cards, true)}
                                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                                           >
                                              Forçar
                                           </button>
                                        </div>
                                     </div>
                                  </div>

                                  {/* Tópicos Expandable Container */}
                                  {isMatExpanded && (
                                     <div className="divide-y divide-slate-100 bg-white">
                                        {(() => {
                                           const topicoKeys = Object.keys(m.topicos);
                                           if (topicoKeys.length === 0) {
                                              return (
                                                 <div className="p-4 text-xs text-slate-400 italic text-center">Nenhum tópico cadastrado ainda nesse baralho.</div>
                                              );
                                           }
                                           return topicoKeys.map(topId => {
                                              const t = m.topicos[topId];
                                              const tStats = getCardsStats(t.cards);
                                              const subKeys = Object.keys(t.subtopicos);
                                              const hasSubDecks = subKeys.length > 0;
                                              const isTopExpanded = expandedTopicos[t.id] || !!deckSearch;

                                              return (
                                                 <div key={t.id} className="transition-all hover:bg-slate-50/20">
                                                    {/* Tópico Header */}
                                                    <div className="p-3.5 pl-6 sm:pl-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-indigo-500/20 hover:border-indigo-500 transition-all">
                                                       <div className="flex items-center gap-2">
                                                          {hasSubDecks ? (
                                                             <button 
                                                                onClick={() => setExpandedTopicos(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                                                                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
                                                             >
                                                                {isTopExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                                             </button>
                                                          ) : (
                                                             <span className="w-6 h-6 flex items-center justify-center text-slate-300">
                                                                •
                                                             </span>
                                                          )}
                                                          
                                                          <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600 shrink-0">
                                                             <GraduationCap className="w-3.5 h-3.5" />
                                                          </div>
                                                          
                                                          <h5 className="font-bold text-slate-705 text-xs pr-2 leading-snug">{t.titulo}</h5>
                                                       </div>

                                                       <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0 ml-8 sm:ml-0">
                                                          <div className="flex items-center gap-1.5">
                                                             {tStats.novos > 0 && <span className="text-[9px] font-bold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-100">{tStats.novos} N</span>}
                                                             {tStats.revisoes > 0 ? (
                                                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-100">{tStats.revisoes} R</span>
                                                             ) : (
                                                                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">Ok</span>
                                                             )}
                                                             <span className="text-[9px] text-slate-400">({tStats.total})</span>
                                                          </div>

                                                          <div className="flex items-center gap-1">
                                                             <button onClick={() => handleExportAnki(t, t.topicoTitulo)} className="px-1.5 py-1 bg-white hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 rounded transition-all cursor-pointer mr-0.5" title="Exportar para Anki (.csv)"><Download className="w-3 h-3" /></button>
                                                             <button onClick={() => handleDeleteDeck('topico', t)} className="px-1.5 py-1 bg-white hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded transition-all cursor-pointer mr-0.5" title="Apagar todos cartões deste tópico"><Trash2 className="w-3 h-3" /></button>
                                                             <button 
                                                                onClick={() => startStudy(t.cards, false)} 
                                                                disabled={tStats.revisoes + tStats.novos === 0}
                                                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-850 disabled:opacity-45 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-indigo-700 font-bold rounded text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                                                             >
                                                                Revisar
                                                             </button>
                                                             {tStats.novos > 0 && (
                                                                <button 
                                                                   onClick={() => startStudy(t.cards, false, true)} 
                                                                   className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded text-[9px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1"
                                                                >
                                                                   <Sparkles className="w-2.5 h-2.5"/> Novos
                                                                </button>
                                                             )}
                                                             <button 
                                                                onClick={() => startStudy(t.cards, true)}
                                                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                                                             >
                                                                Forçar
                                                             </button>
                                                          </div>
                                                       </div>
                                                    </div>

                                                    {/* Assunto / Subtopicos list (Level 3 Deck) */}
                                                    {hasSubDecks && isTopExpanded && (
                                                       <div className="divide-y divide-slate-100/50 bg-slate-50 border-t border-slate-150 pl-10 sm:pl-12">
                                                          {subKeys.map(subKey => {
                                                             const s = t.subtopicos[subKey];
                                                             const sStats = getCardsStats(s.cards);

                                                             return (
                                                                <div key={subKey} className="p-3 pl-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-all hover:bg-indigo-50/20">
                                                                   <div className="flex items-center gap-2">
                                                                      <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                      <span className="text-xs font-semibold text-slate-600">{s.titulo}</span>
                                                                   </div>

                                                                   <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0 ml-5 sm:ml-0">
                                                                      <div className="flex items-center gap-1.5">
                                                                         {sStats.novos > 0 && <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1 py-0.5 rounded border border-blue-100/30">{sStats.novos} N</span>}
                                                                         {sStats.revisoes > 0 ? (
                                                                            <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-1 py-0.5 rounded border border-amber-100/30">{sStats.revisoes} R</span>
                                                                         ) : (
                                                                            <span className="text-[9px] font-semibold text-slate-400 bg-slate-100/60 px-1 py-0.5 rounded">Ok</span>
                                                                         )}
                                                                         <span className="text-[9px] text-slate-400">({sStats.total})</span>
                                                                      </div>

                                                                      <div className="flex items-center gap-1">
                                                                         <button onClick={() => handleExportAnki(s, s.subtopicoTitulo)} className="px-1.5 py-1 bg-transparent hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 rounded transition-all cursor-pointer mr-0.5" title="Exportar para Anki (.csv)"><Download className="w-3 h-3" /></button>
                                                                         <button onClick={() => handleDeleteDeck('subtopico', s)} className="px-1.5 py-1 bg-transparent hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded transition-all cursor-pointer mr-0.5" title="Apagar todos cartões deste assunto"><Trash2 className="w-3 h-3" /></button>
                                                                         <button 
                                                                            onClick={() => startStudy(s.cards, false)} 
                                                                            disabled={sStats.revisoes + sStats.novos === 0}
                                                                            className="px-2 py-1 bg-white hover:bg-indigo-50 disabled:opacity-40 disabled:bg-slate-50 disabled:text-slate-400 text-indigo-650 border border-slate-200 hover:border-indigo-200 font-bold rounded text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                                                                         >
                                                                            Revisar
                                                                         </button>
                                                                         {sStats.novos > 0 && (
                                                                            <button 
                                                                               onClick={() => startStudy(s.cards, false, true)} 
                                                                               className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold rounded text-[9px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1"
                                                                            >
                                                                               <Sparkles className="w-2.5 h-2.5"/> Novos
                                                                            </button>
                                                                         )}
                                                                         <button 
                                                                            onClick={() => startStudy(s.cards, true)}
                                                                            className="px-1.5 py-1 bg-slate-100/60 hover:bg-slate-150 text-slate-500 font-semibold rounded text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                                                                         >
                                                                            Forçar
                                                                         </button>
                                                                      </div>
                                                                   </div>
                                                                </div>
                                                             );
                                                          })}
                                                       </div>
                                                    )}
                                                 </div>
                                              );
                                           });
                                        })()}
                                     </div>
                                  )}
                               </div>
                            );
                         })}
                      </div>
                   );
                })()}
             </div>
             
             <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                   <Layers className="w-12 h-12 text-indigo-500 mb-4" />
                   <h3 className="text-3xl font-bold text-slate-900 mb-2">{allCards.length}</h3>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Cartões Totais</p>
                   
                   <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-xl w-full flex flex-col items-center">
                      <p className="text-[10px] uppercase tracking-widest opacity-80 font-bold mb-1">Para Revisar Hoje</p>
                      <h4 className="font-bold text-2xl mb-2">{cardsToReview.length}</h4>
                      {newCardsToStudy.length > 0 && <span className="text-[10px] font-bold text-amber-600 bg-amber-100/50 px-2 py-0.5 rounded-full mb-2">+{newCardsToStudy.length} novos aguardando</span>}
                      
                      <div className="flex flex-col w-full gap-2 mt-2 border-t border-amber-200/50 pt-4">
                         <button onClick={() => startStudy(allCards, false)} disabled={cardsToReview.length === 0} className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs transition-all uppercase tracking-widest shadow-md">
                            Revisar Tudo
                         </button>
                         <button onClick={() => startStudy(allCards, false, true)} disabled={newCardsToStudy.length === 0} className="w-full px-4 py-2 bg-emerald-600/90 hover:bg-emerald-600 disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-white shadow-md font-bold rounded-lg text-[10px] transition-all uppercase tracking-widest flex items-center justify-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5"/> Revisar Apenas Novos
                         </button>
                         <button onClick={() => startStudy(allCards, true)} className="w-full px-4 py-2 bg-amber-200/50 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-[10px] transition-all uppercase tracking-widest">
                            Forçar Revisão (Tudo)
                         </button>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                   <div className="flex items-center gap-2 mb-4">
                      <h3 className="font-bold text-slate-900">Perguntas Frequentes</h3>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] uppercase tracking-widest font-bold rounded-md">Rank</span>
                   </div>
                   {cartoesFrequencies.length === 0 ? (
                      <p className="text-[11px] font-medium text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-slate-100 border-dashed">Nenhuma pergunta repetida.</p>
                   ) : (
                      <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-2 hide-scrollbar">
                         {cartoesFrequencies.map((group, gIdx) => (
                            <div key={gIdx} className="bg-slate-50 rounded-2xl border border-slate-100 p-3 shadow-sm">
                               <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3 pb-2 border-b border-indigo-100/50 flex flex-wrap gap-1">
                                  {group.assunto.split(' > ').map((part, pIdx, arr) => (
                                     <span key={pIdx}>
                                        {part}
                                        {pIdx < arr.length - 1 && <span className="mx-1.5 text-indigo-200">›</span>}
                                     </span>
                                  ))}
                               </div>
                               <div className="flex flex-col gap-2">
                                  {group.ranking.slice(0, 5).map(([q, count], i) => (
                                     <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-white rounded-xl border border-slate-100 hover:border-indigo-200 transition-all shadow-[0_2px_5px_rgb(0,0,0,0.01)] hover:shadow-[0_2px_10px_rgb(0,0,0,0.04)]">
                                       <span className="font-medium text-slate-700 line-clamp-1 mr-3 flex-1" title={q}>{q}</span>
                                       <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-lg shrink-0 shadow-sm">{count}x</span>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                   <h3 className="font-bold text-slate-900 mb-4">Previsão de Revisões</h3>
                   <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                         <span className="text-xl font-bold text-slate-800">{forecast.tomorrow}</span>
                         <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mt-1">Amanhã</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                         <span className="text-xl font-bold text-slate-800">{forecast.next7Days}</span>
                         <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mt-1 text-center">Próximos<br/>7 Dias</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                         <span className="text-xl font-bold text-slate-800">{forecast.next30Days}</span>
                         <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mt-1 text-center">+ de<br/>7 Dias</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {(activeTab === 'importar' || activeTab === 'manual') && (
           <div className="flex flex-col gap-6">
              {/* Seletor Comum */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shrink-0">
                 <h3 className="font-bold text-slate-900 mb-4 block">1. Selecione o Destino (Edital / Matéria / Tópico)</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <select value={selectedEdital} onChange={(e) => { setSelectedEdital(e.target.value); setSelectedArea(""); setSelectedMateria(""); setSelectedTopico(""); setSelectedSubtopico(""); }} className="p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-300">
                       <option value="">Selecione o Edital...</option>{editais.map(e => <option key={e.id} value={e.id}>{e.titulo}</option>)}
                    </select>
                    <select value={selectedArea} onChange={(e) => { setSelectedArea(e.target.value); setSelectedMateria(""); setSelectedTopico(""); setSelectedSubtopico(""); }} className="p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-300" disabled={!selectedEdital}>
                       <option value="">A Área...</option>{editalObj?.areas.map(a => <option key={a.id} value={a.id}>{a.area}</option>)}
                    </select>
                    <select value={selectedMateria} onChange={(e) => { setSelectedMateria(e.target.value); setSelectedTopico(""); setSelectedSubtopico(""); }} className="p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-300" disabled={!selectedArea}>
                       <option value="">A Matéria...</option>{areaObj?.materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                    </select>
                    <select value={selectedTopico} onChange={(e) => { setSelectedTopico(e.target.value); setSelectedSubtopico(""); }} className="p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-300" disabled={!selectedMateria}>
                       <option value="">O Tópico...</option>{materiaObj?.topicos.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                    </select>
                    {topicoObj && (
                       <div className="sm:col-span-2 md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                          <div className="flex flex-col gap-1">
                             <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Assunto Existente</span>
                             <select value={selectedSubtopico} onChange={(e) => { setSelectedSubtopico(e.target.value); setNewAssunto(""); }} className="p-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-300 w-full" disabled={!!newAssunto}>
                                <option value="">(Geral / Tópico Principal)</option>
                                {topicoObj.subtopicos.map(st => <option key={st.id} value={st.id}>{st.titulo}</option>)}
                             </select>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                             <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Criar Novo Assunto</span>
                             <input 
                                value={newAssunto} 
                                onChange={(e) => { setNewAssunto(e.target.value); setSelectedSubtopico(""); }} 
                                placeholder="Digite o nome do novo assunto..."
                                className="p-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-300 w-full focus:ring-4 focus:ring-emerald-500/10 transition-all"
                             />
                          </div>
                       </div>
                    )}
                 </div>
              </div>

              {activeTab === 'manual' && (
                 <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 max-w-2xl">
                    <h3 className="font-bold text-slate-900 mb-2">2. Digite os Dados do Cartão</h3>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1 block">Frente (Pergunta)</span>
                      <textarea
                         value={perguntaManual}
                         onChange={(e) => setPerguntaManual(e.target.value)}
                         onPaste={(e) => handleImagePaste(e, setImagemPerguntaManual)}
                         className="w-full text-sm font-medium text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-200 focus:border-indigo-300 focus:bg-white outline-none resize-none transition-all focus:ring-4 focus:ring-indigo-500/10"
                         rows={3} placeholder="Escreva a pergunta ou conceito aqui... (Você pode colar uma imagem com Ctrl+V)"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1 block">Imagem da Pergunta (URL opcional)</span>
                      <input
                         value={imagemPerguntaManual}
                         onChange={(e) => setImagemPerguntaManual(e.target.value)}
                         className="w-full text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                         placeholder="Cole a URL da imagem aqui..."
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 block">Verso (Resposta)</span>
                      <textarea
                         value={respostaManual}
                         onChange={(e) => setRespostaManual(e.target.value)}
                         onPaste={(e) => handleImagePaste(e, setImagemRespostaManual)}
                         className="w-full text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 focus:border-emerald-300 focus:bg-white outline-none resize-none transition-all focus:ring-4 focus:ring-emerald-500/10"
                         rows={4} placeholder="Escreva a resposta ou definição aqui... (Você pode colar uma imagem com Ctrl+V)"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 block">Imagem da Resposta (URL opcional)</span>
                      <input
                         value={imagemRespostaManual}
                         onChange={(e) => setImagemRespostaManual(e.target.value)}
                         className="w-full text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                         placeholder="Cole a URL da imagem aqui..."
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 block">Origem (Concurso/Prova opcional)</span>
                      <input
                         list="unique-origens"
                         value={manualOrigem}
                         onChange={(e) => setManualOrigem(e.target.value)}
                         className="w-full text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 focus:border-amber-300 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                         placeholder="Ex: FCC 2023, CESPE..."
                      />
                    </div>
                    <button onClick={handleSaveManual} className="mt-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all uppercase tracking-widest self-end">Adicionar Cartão</button>
                 </div>
              )}

              {activeTab === 'importar' && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                    {conflictMode && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 p-8 flex flex-col rounded-[2rem] border border-slate-100 shadow-2xl">
                           <div className="flex items-center gap-3 mb-2">
                             <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                                <Info className="w-5 h-5"/>
                             </div>
                             <h2 className="text-2xl font-bold text-slate-800">Importação Concluída</h2>
                           </div>
                           <p className="text-slate-600 mt-2 mb-6 text-sm ml-13">Os cartões foram importados com sucesso. Notamos que as seguintes perguntas já existiam e foram inseridas novamente no seu banco:</p>
                           
                           <div className="flex-1 overflow-y-auto mb-6 pr-2 ml-13">
                              <div className="flex flex-col gap-3">
                                 {importConflicts.map((c, idx) => (
                                    <div key={idx} className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl flex flex-col gap-1.5 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                                       <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                          Frente Repetida
                                       </span>
                                       <p className="text-sm font-medium text-slate-800 pl-3 border-l-2 border-amber-200">{c.imported.pergunta}</p>
                                    </div>
                                 ))}
                              </div>
                           </div>

                           <div className="flex justify-end shrink-0 pt-6 border-t border-slate-100">
                              <button onClick={finishImport} className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5">Ok, Entendi</button>
                           </div>
                        </div>
                    )}
                    
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-1">
                       <div className="flex items-start gap-3 mb-4">
                          <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><Info className="w-5 h-5"/></div>
                          <div>
                            <h3 className="font-bold text-slate-900">Formato: Pergunta;Resposta</h3>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1">Cole o texto onde a Pergunta e a Resposta são separadas por ponto e vírgula (;).</p>
                          </div>
                       </div>
                       <div className="mb-4">
                          <textarea value={textoColado} onChange={(e) => setTextoColado(e.target.value)} className="w-full h-64 p-4 text-sm font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition-all placeholder:text-slate-400" placeholder="Qual a capital do Brasil?;Brasília&#10;O que é um ato administrativo?;É a declaração do Estado..." />
                       </div>
                       <button onClick={handleParse} disabled={!textoColado.trim()} className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 uppercase tracking-widest"><Sparkles className="w-4 h-4"/> Visualizar</button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col h-[60vh]">
                       <h3 className="font-bold text-slate-900 mb-2 mt-2 pt-2 flex justify-between items-center shrink-0">
                          <span>Preview e Edição</span>
                          {parsedCards.length > 0 && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">{parsedCards.length} cartões</span>}
                       </h3>
                       <div className="flex-1 overflow-y-auto mb-4 border border-slate-200 bg-slate-50 rounded-2xl p-2 hide-scrollbar">
                          {parsedCards.length === 0 ? (
                             <div className="h-full flex items-center justify-center text-slate-400 text-xs text-center p-4">Gere os cartões à esquerda para visualizar aqui</div>
                          ) : (
                             <div className="flex flex-col gap-3">
                                {parsedCards.map((c, idx) => (
                                   <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 relative group">
                                      <button onClick={() => setParsedCards(parsedCards.filter((_, i) => i !== idx))} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
                                      <div className="mb-2">
                                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest block mb-0.5">Pergunta</span>
                                        <input value={c.pergunta} onChange={(e) => { const nc = [...parsedCards]; nc[idx].pergunta = e.target.value; setParsedCards(nc); }} className="w-full text-xs font-medium text-slate-900 outline-none border-b border-transparent focus:border-indigo-200"/>
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block mb-0.5">Resposta</span>
                                        <input value={c.resposta} onChange={(e) => { const nc = [...parsedCards]; nc[idx].resposta = e.target.value; setParsedCards(nc); }} className="w-full text-xs text-slate-600 outline-none border-b border-transparent focus:border-emerald-200"/>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          )}
                       </div>
                       <div className="mb-4 text-left">
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">Origem (Concurso/Prova opcional para o lote)</span>
                          <input
                             list="unique-origens"
                             value={importOrigem}
                             onChange={(e) => setImportOrigem(e.target.value)}
                             className="w-full text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-300 transition-all placeholder:text-slate-400"
                             placeholder="Ex: FCC 2023, VUNESP..."
                          />
                       </div>
                       <button onClick={handleSaveImport} disabled={parsedCards.length === 0 || !selectedTopico} className="w-full px-6 py-3 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-900/20 uppercase tracking-widest shrink-0">Salvar Cartões</button>
                    </div>
                 </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
}
