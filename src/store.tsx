import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Edital, Materia, RevisaoAgendada, StudyCycle, StudyCycleItem } from "./types";
import { addDays, isPast, isToday, differenceInDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { collection, doc, onSnapshot, query, setDoc, where, deleteDoc, getDocFromServer, getDocs } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { useAuth } from "./AuthContext";

interface EditalContextType {
  editais: Edital[];
  managedEditais: Edital[];
  ciclos: StudyCycle[];
  managedCiclos: StudyCycle[];
  addEdital: (edital: Edital) => void;
  deleteEdital: (id: string) => void;
  toggleVisto: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string) => void;
  updateItemTitle: (editalId: string, areaId: string, materiaId: string, itemId: string, newTitle: string, type: 'edital' | 'area' | 'materia' | 'topico' | 'subtopico') => void;
  deleteItem: (editalId: string, areaId: string, materiaId: string, itemId: string, type: 'area' | 'materia' | 'topico' | 'subtopico') => void;
  addItem: (editalId: string, areaId?: string, materiaId?: string, topicoId?: string, title?: string) => void;
  addMaterias: (editalId: string, areaId: string, materias: Materia[]) => void;
  addCustomRevisionDate: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string) => void;
  removeRevisionDate: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string) => void;
  setNextRevisionDate: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string | null) => void;
  setStudyDate: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string | null) => void;
  updateNota: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, nota: string) => void;
  updateCartoes: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, cartao: { id: string, pergunta: string, resposta: string }[]) => void;
  updateCartaoSM2: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, cartaoId: string, quality: number) => void;
  updateMetricas: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, acertos: number, erros: number) => void;
  revisions: RevisaoAgendada[];
  completeRevision: (topicoOuSubId: string, dataRevisao: string) => void;
  getPublicEdital: (id: string) => Promise<Edital | null>;
  setEditalPublic: (id: string, isPublic: boolean, cycleIdsToPublic?: string[]) => Promise<void>;
  addCiclo: (ciclo: StudyCycle) => void;
  deleteCiclo: (id: string) => void;
  updateCiclo: (ciclo: StudyCycle) => void;
  toggleCicloItem: (cicloId: string, itemId: string) => void;
  getPublicCiclos: (editalId: string) => Promise<StudyCycle[]>;
}

const EditalContext = createContext<EditalContextType | undefined>(undefined);

export function EditalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [editais, setEditais] = useState<Edital[]>([]);
  const [managedEditais, setManagedEditais] = useState<Edital[]>([]);
  const [ciclos, setCiclos] = useState<StudyCycle[]>([]);
  const [managedCiclos, setManagedCiclos] = useState<StudyCycle[]>([]);

  useEffect(() => {
    if (!user) {
      setEditais([]);
      setCiclos([]);
      return;
    }
    const q = query(collection(db, "editais"), where("userId", "==", user.uid));
    const unsubscribeEditais = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(changeDoc => {
         const obj = changeDoc.data();
         obj.id = changeDoc.id;
         return obj as Edital;
      });
      setEditais(data);
    }, (err) => {
       handleFirestoreError(err, OperationType.GET, "editais");
    });

    const qCiclos = query(collection(db, "ciclos"), where("userId", "==", user.uid));
    const unsubscribeCiclos = onSnapshot(qCiclos, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const obj = doc.data();
        obj.id = doc.id;
        return obj as StudyCycle;
      });
      setCiclos(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "ciclos");
    });

    const qManagedEditais = query(collection(db, "editais"), where("managedBy", "==", user.uid));
    const unsubscribeManagedEditais = onSnapshot(qManagedEditais, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const obj = doc.data();
        obj.id = doc.id;
        return obj as Edital;
      });
      setManagedEditais(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "editais");
    });

    const qManagedCiclos = query(collection(db, "ciclos"), where("managedBy", "==", user.uid));
    const unsubscribeManagedCiclos = onSnapshot(qManagedCiclos, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const obj = doc.data();
        obj.id = doc.id;
        return obj as StudyCycle;
      });
      setManagedCiclos(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "ciclos");
    });

    return () => {
      unsubscribeEditais();
      unsubscribeCiclos();
      unsubscribeManagedEditais();
      unsubscribeManagedCiclos();
    };
  }, [user]);

  const addCiclo = (ciclo: StudyCycle) => {
    if (!user) return;
    // Prevent duplicates
    if (ciclos.some(c => c.id === ciclo.id || (c.originalCycleId && c.originalCycleId === ciclo.originalCycleId))) return;
    
    const cycleUserId = ciclo.userId || user.uid;
    setDoc(doc(db, "ciclos", ciclo.id), { ...ciclo, userId: cycleUserId }).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `ciclos/${ciclo.id}`);
    });
  };

  const deleteCiclo = (id: string) => {
    if (!user) return;
    deleteDoc(doc(db, "ciclos", id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `ciclos/${id}`);
    });
  };

  const updateCiclo = (ciclo: StudyCycle) => {
    if (!user) return;
    const cycleUserId = ciclo.userId || user.uid;
    setDoc(doc(db, "ciclos", ciclo.id), { ...ciclo, userId: cycleUserId }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `ciclos/${ciclo.id}`);
    });
  };

  const toggleCicloItem = (cicloId: string, itemId: string) => {
    let ciclo = ciclos.find(c => c.id === cicloId);
    if (!ciclo) {
      ciclo = managedCiclos.find(c => c.id === cicloId);
    }
    if (ciclo) {
      const newItems = ciclo.items.map(item => {
        if (item.id === itemId) return { ...item, concluido: !item.concluido };
        return item;
      });
      updateCiclo({ ...ciclo, items: newItems });
    }
  };

  const handleUpdate = (editalId: string, updater: (edital: Edital) => void) => {
    if (!user) return;
    
    // Check if it's in the user's own editais
    const isOwner = editais.some(e => e.id === editalId);
    
    if (isOwner) {
      setEditais(prev => {
        const newArray = JSON.parse(JSON.stringify(prev)) as Edital[];
        const edital = newArray.find(e => e.id === editalId);
        if (edital) {
          updater(edital);
          setDoc(doc(db, "editais", edital.id), JSON.parse(JSON.stringify({ ...edital, userId: user.uid }))).catch(err => {
             handleFirestoreError(err, OperationType.UPDATE, `editais/${edital.id}`);
          });
        }
        return newArray;
      });
    } else {
      // Must be in managed
      setManagedEditais(prev => {
        const newArray = JSON.parse(JSON.stringify(prev)) as Edital[];
        const edital = newArray.find(e => e.id === editalId);
        if (edital) {
          updater(edital);
          // Preserve the original userId of the student!
          setDoc(doc(db, "editais", edital.id), JSON.parse(JSON.stringify(edital))).catch(err => {
             handleFirestoreError(err, OperationType.UPDATE, `editais/${edital.id}`);
          });
        }
        return newArray;
      });
    }
  };

  const addEdital = (edital: Edital) => {
    if (!user) return;
    // Prevent duplicates
    if (editais.some(e => e.id === edital.id || (e.originalEditalId && e.originalEditalId === edital.originalEditalId))) return;
    
    setEditais((prev) => [...prev, edital]);
    setDoc(doc(db, "editais", edital.id), JSON.parse(JSON.stringify({ ...edital, userId: user.uid }))).catch(err => {
       handleFirestoreError(err, OperationType.CREATE, `editais/${edital.id}`);
    });
  };
  
  const deleteEdital = (id: string) => {
    if (!user) return;
    setEditais((prev) => prev.filter((e) => e.id !== id));
    deleteDoc(doc(db, "editais", id)).catch(err => {
       handleFirestoreError(err, OperationType.DELETE, `editais/${id}`);
    });
  };

  const toggleVisto = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string) => {
    handleUpdate(editalId, (edital) => {
      const now = new Date().toISOString();
      const area = edital.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);
      
      if (!topico) return;

      if (subtopicoId) {
        const sub = topico.subtopicos.find(s => s.id === subtopicoId);
        if (sub) {
          sub.visto = !sub.visto;
          if (sub.visto) {
             sub.data_estudo = now;
             sub.revisoes_agendadas = [1, 7, 15, 30].map(days => addDays(new Date(), days).toISOString());
          } else {
             sub.data_estudo = null;
             sub.revisoes_agendadas = [];
          }
        }
      } else {
        topico.visto = !topico.visto;
        if (topico.visto) {
          topico.data_estudo = now;
          topico.revisoes_agendadas = [1, 7, 15, 30].map(days => addDays(new Date(), days).toISOString());
        } else {
          topico.data_estudo = null;
          topico.revisoes_agendadas = [];
        }
      }
    });
  };

  const completeRevision = (itemId: string, dataRevisao: string) => {
    if (!user) return;
    
    // Find which edital contains this itemId
    const allEditais = [...editais, ...managedEditais];
    const targetEdital = allEditais.find(ed => {
       for (const area of ed.areas) {
          for (const materia of area.materias) {
             for (const topico of materia.topicos) {
                if (topico.id === itemId) return true;
                if (topico.subtopicos.some(s => s.id === itemId)) return true;
             }
          }
       }
       return false;
    });

    if (targetEdital) {
       handleUpdate(targetEdital.id, (edital) => {
          for (const area of edital.areas) {
            for (const materia of area.materias) {
              for (const topico of materia.topicos) {
                if (topico.id === itemId) {
                  topico.revisoes_agendadas = topico.revisoes_agendadas.filter(r => r !== dataRevisao);
                  topico.revisoes_concluidas = (topico.revisoes_concluidas || 0) + 1;
                }
                for (const sub of topico.subtopicos) {
                  if (sub.id === itemId) {
                    sub.revisoes_agendadas = sub.revisoes_agendadas.filter(r => r !== dataRevisao);
                    sub.revisoes_concluidas = (sub.revisoes_concluidas || 0) + 1;
                  }
                }
              }
            }
          }
       });
    }
  };

  const addItem = (editalId: string, areaId?: string, materiaId?: string, topicoId?: string, title: string = "Novo Item") => {
    handleUpdate(editalId, (edital) => {
      if (!areaId) {
        edital.areas.push({ id: uuidv4(), area: title, materias: [] });
      } else if (!materiaId) {
        const area = edital.areas.find(a => a.id === areaId);
        if (area) area.materias.push({ id: uuidv4(), nome: title, topicos: [] });
      } else if (!topicoId) {
        const area = edital.areas.find(a => a.id === areaId);
        const materia = area?.materias.find(m => m.id === materiaId);
        if (materia) materia.topicos.push({ id: uuidv4(), titulo: title, visto: false, data_estudo: null, revisoes_agendadas: [], subtopicos: [] });
      } else {
        const area = edital.areas.find(a => a.id === areaId);
        const materia = area?.materias.find(m => m.id === materiaId);
        const topico = materia?.topicos.find(t => t.id === topicoId);
        if (topico) topico.subtopicos.push({ id: uuidv4(), titulo: title, visto: false, data_estudo: null, revisoes_agendadas: [] });
      }
    });
  };

  const addMaterias = (editalId: string, areaId: string, materias: Materia[]) => {
    handleUpdate(editalId, (edital) => {
      const area = edital.areas.find(a => a.id === areaId);
      if (area) {
        area.materias.push(...materias);
      }
    });
  };

  const addCustomRevisionDate = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string) => {
    handleUpdate(editalId, (edital) => {
      const area = edital.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);
      if (!topico) return;

      if (subtopicoId) {
        const sub = topico.subtopicos.find(s => s.id === subtopicoId);
        if (sub && !sub.revisoes_agendadas.includes(dateStr)) sub.revisoes_agendadas.push(dateStr);
      } else {
        if (!topico.revisoes_agendadas.includes(dateStr)) topico.revisoes_agendadas.push(dateStr);
      }
    });
  };

  const removeRevisionDate = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string) => {
    handleUpdate(editalId, (edital) => {
      const area = edital.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);
      if (!topico) return;

      if (subtopicoId) {
        const sub = topico.subtopicos.find(s => s.id === subtopicoId);
        if (sub) {
          sub.revisoes_agendadas = sub.revisoes_agendadas.filter(d => d !== dateStr);
        }
      } else {
        topico.revisoes_agendadas = topico.revisoes_agendadas.filter(d => d !== dateStr);
      }
    });
  };

  const setNextRevisionDate = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string | null) => {
    handleUpdate(editalId, (edital) => {
      const area = edital.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);
      if (!topico) return;

      const target = subtopicoId ? topico.subtopicos.find(s => s.id === subtopicoId) : topico;
      if (target) {
        target.revisoes_agendadas = target.revisoes_agendadas.filter((d: string) => isPast(new Date(d)) && !isToday(new Date(d)));
        if (dateStr) {
          target.revisoes_agendadas.push(dateStr);
        }
      }
    });
  };

  const setStudyDate = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string | null) => {
    handleUpdate(editalId, (edital) => {
      const area = edital.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);
      if (!topico) return;

      if (subtopicoId) {
        const sub = topico.subtopicos.find(s => s.id === subtopicoId);
        if (sub) {
           sub.data_estudo = dateStr;
           sub.visto = !!dateStr;
           if (!dateStr) sub.revisoes_agendadas = [];
        }
      } else {
        topico.data_estudo = dateStr;
        topico.visto = !!dateStr;
        if (!dateStr) topico.revisoes_agendadas = [];
      }
    });
  };

  const updateItemTitle = (editalId: string, areaId: string, materiaId: string, itemId: string, newTitle: string, type: 'edital'|'area'|'materia'|'topico'|'subtopico') => {
    handleUpdate(editalId, (edital) => {
      if (type === 'edital') {
        edital.titulo = newTitle;
      } else if(type === 'area') {
        const item = edital.areas.find(a => a.id === itemId);
        if(item) item.area = newTitle;
      } else if (type === 'materia') {
        const area = edital.areas.find(a => a.id === areaId);
        const item = area?.materias.find(m => m.id === itemId);
        if(item) item.nome = newTitle;
      } else if (type === 'topico') {
        const m = edital.areas.find(a => a.id === areaId)?.materias.find(m => m.id === materiaId);
        const item = m?.topicos.find(t => t.id === itemId);
        if(item) item.titulo = newTitle;
      } else if (type === 'subtopico') {
        const m = edital.areas.find(a => a.id === areaId)?.materias.find(m => m.id === materiaId);
        const t = m?.topicos.find(t => t.subtopicos.some(s => s.id === itemId));
        const sub = t?.subtopicos.find(s => s.id === itemId);
        if(sub) sub.titulo = newTitle;
      }
    });
  };

  const deleteItem = (editalId: string, areaId: string, materiaId: string, itemId: string, type: 'area'|'materia'|'topico'|'subtopico') => {
    handleUpdate(editalId, (edital) => {
      if(type === 'area') {
        edital.areas = edital.areas.filter(a => a.id !== itemId);
      } else if (type === 'materia') {
        const area = edital.areas.find(a => a.id === areaId);
        if(area) area.materias = area.materias.filter(m => m.id !== itemId);
      } else if (type === 'topico') {
        const m = edital.areas.find(a => a.id === areaId)?.materias.find(m => m.id === materiaId);
        if(m) m.topicos = m.topicos.filter(t => t.id !== itemId);
      } else if (type === 'subtopico') {
        const m = edital.areas.find(a => a.id === areaId)?.materias.find(m => m.id === materiaId);
        if(m) {
          const t = m.topicos.find(t => t.subtopicos.some(s => s.id === itemId));
          if(t) t.subtopicos = t.subtopicos.filter(s => s.id !== itemId);
        }
      }
    });
  };

  const updateNota = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, nota: string) => {
    handleUpdate(editalId, (edital) => {
      const area = edital.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);
      if (!topico) return;

      if (subtopicoId) {
        const sub = topico.subtopicos.find(s => s.id === subtopicoId);
        if (sub) sub.notas = nota;
      } else {
        topico.notas = nota;
      }
    });
  };

  const updateCartoes = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, cartoes: { id: string, pergunta: string, resposta: string, repetition?: number, interval?: number, easeFactor?: number, nextReview?: string }[]) => {
    handleUpdate(editalId, (edital) => {
      const area = edital.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);
      if (!topico) return;

      if (subtopicoId) {
        const sub = topico.subtopicos.find(s => s.id === subtopicoId);
        if (sub) sub.cartoes = cartoes as any;
      } else {
        topico.cartoes = cartoes as any;
      }
    });
  };

  const updateCartaoSM2 = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, cartaoId: string, quality: number) => {
    handleUpdate(editalId, (edital) => {
      const area = edital.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);
      if (!topico) return;
      
      let cartoes = subtopicoId ? (topico.subtopicos.find(s => s.id === subtopicoId)?.cartoes) : (topico.cartoes);
      if (!cartoes) return;
      
      const cartao = cartoes.find(c => c.id === cartaoId);
      if (!cartao) return;
      
      // Default SM2 Values if missing
      let repetition = cartao.repetition || 0;
      let interval = cartao.interval || 0;
      let easeFactor = cartao.easeFactor || 2.5;

      // Anki variant logic for SM2
      if (quality < 3) {
        repetition = 0;
        interval = 1;
      } else {
        if (repetition === 0) {
          interval = 1;
        } else if (repetition === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }
        repetition++;
      }

      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + interval);

      cartao.repetition = repetition;
      cartao.interval = interval;
      cartao.easeFactor = easeFactor;
      cartao.nextReview = nextDate.toISOString();
    });
  };

  const updateMetricas = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, acertos: number, erros: number) => {
    handleUpdate(editalId, (edital) => {
      const area = edital.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);
      if (!topico) return;

      if (subtopicoId) {
        const sub = topico.subtopicos.find(s => s.id === subtopicoId);
        if (sub) {
           sub.acertos = acertos;
           sub.erros = erros;
        }
      } else {
        topico.acertos = acertos;
        topico.erros = erros;
      }
    });
  };

  const revisions: RevisaoAgendada[] = [];
  const allCurrentEditais = [...editais, ...managedEditais];
  allCurrentEditais.forEach(edital => {
    if (!edital || !edital.areas) return;
    edital.areas.forEach(area => {
      if (!area || !area.materias) return;
      area.materias.forEach(materia => {
        if (!materia || !materia.topicos) return;
        materia.topicos.forEach(topico => {
          if (!topico) return;
          if (topico.revisoes_agendadas) {
             topico.revisoes_agendadas.forEach(revDateStr => {
               const revDate = new Date(revDateStr);
               if (isPast(revDate) || isToday(revDate)) {
                  revisions.push({
                    editalId: edital.id,
                    editalTitulo: edital.titulo,
                    areaId: area.id,
                    areaNome: area.area,
                    materiaId: materia.id,
                    materiaNome: materia.nome,
                    topicoOuSubId: topico.id,
                    tituloItem: topico.titulo,
                    dataRevisao: revDateStr,
                    atrasada: isPast(revDate) && !isToday(revDate),
                    diasAtraso: differenceInDays(new Date(), revDate)
                  });
               }
             });
          }
          
          if (topico.subtopicos) {
             topico.subtopicos.forEach(sub => {
               if (sub.revisoes_agendadas) {
                  sub.revisoes_agendadas.forEach(revDateStr => {
                    const revDate = new Date(revDateStr);
                    if (isPast(revDate) || isToday(revDate)) {
                       revisions.push({
                         editalId: edital.id,
                         editalTitulo: edital.titulo,
                         areaId: area.id,
                         areaNome: area.area,
                         materiaId: materia.id,
                         materiaNome: materia.nome,
                         topicoOuSubId: sub.id,
                         tituloItem: sub.titulo,
                         dataRevisao: revDateStr,
                         atrasada: isPast(revDate) && !isToday(revDate),
                         diasAtraso: differenceInDays(new Date(), revDate)
                       });
                    }
                  });
               }
             });
          }
        });
      });
    });
  });

  revisions.sort((a, b) => b.diasAtraso - a.diasAtraso);

  const getPublicEdital = async (id: string): Promise<Edital | null> => {
    try {
      const docSnap = await getDocFromServer(doc(db, "editais", id));
      if (docSnap.exists()) {
        const data = docSnap.data() as Edital;
        if (data.isPublic) {
          data.id = docSnap.id;
          return data;
        }
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const getPublicCiclos = async (editalId: string): Promise<StudyCycle[]> => {
    try {
      const q = query(collection(db, "ciclos"), where("editalId", "==", editalId), where("isPublic", "==", true));
      const querySnapshot = await getDocs(q); 
      const results: StudyCycle[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as StudyCycle;
        data.id = doc.id;
        results.push(data);
      });
      return results;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const setEditalPublic = async (id: string, isPublic: boolean, cycleIdsToPublic?: string[]): Promise<void> => {
    if (!user) return;
    try {
      const ownerName = user.displayName || user.email || "Usuário Anônimo";
      await setDoc(doc(db, "editais", id), { isPublic, ownerName }, { merge: true });
      setEditais(prev => prev.map(e => e.id === id ? { ...e, isPublic, ownerName } : e));
      
      // Update isPublic for ALL cycles linked to this edital, but based on cycleIdsToPublic
      const relatedCiclos = ciclos.filter(c => c.editalId === id);
      for (const c of relatedCiclos) {
        const shouldBePublic = cycleIdsToPublic ? cycleIdsToPublic.includes(c.id) : isPublic;
        if (c.isPublic !== shouldBePublic) {
          await setDoc(doc(db, "ciclos", c.id), { isPublic: shouldBePublic, ownerName }, { merge: true }).catch(err => {
            console.error("Erro ao atualizar ciclo", err);
          });
        }
      }
      setCiclos(prev => prev.map(c => {
         if (c.editalId === id) {
            const shouldBePublic = cycleIdsToPublic ? cycleIdsToPublic.includes(c.id) : isPublic;
            return { ...c, isPublic: shouldBePublic, ownerName };
         }
         return c;
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `editais/${id}`);
    }
  };

  return (
    <EditalContext.Provider value={{
      editais, managedEditais, addEdital, deleteEdital, toggleVisto, updateItemTitle,
      deleteItem, addItem, addMaterias, addCustomRevisionDate,
      removeRevisionDate, setNextRevisionDate, setStudyDate, updateNota, updateCartoes, updateCartaoSM2,
      updateMetricas, revisions, completeRevision, getPublicEdital, setEditalPublic,
      ciclos, managedCiclos, addCiclo, deleteCiclo, updateCiclo, toggleCicloItem, getPublicCiclos
    }}>
      {children}
    </EditalContext.Provider>
  );
}

export function useEdital() {
  const context = useContext(EditalContext);
  if (context === undefined) throw new Error("useEdital must be used within EditalProvider");
  return context;
}
