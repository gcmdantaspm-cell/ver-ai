import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Edital, RevisaoAgendada } from "./types";
import { addDays, isPast, isToday, differenceInDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { collection, doc, onSnapshot, query, setDoc, where, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { useAuth } from "./AuthContext";

interface EditalContextType {
  editais: Edital[];
  addEdital: (edital: Edital) => void;
  deleteEdital: (id: string) => void;
  toggleVisto: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string) => void;
  updateItemTitle: (editalId: string, areaId: string, materiaId: string, itemId: string, newTitle: string, type: 'area' | 'materia' | 'topico' | 'subtopico') => void;
  deleteItem: (editalId: string, areaId: string, materiaId: string, itemId: string, type: 'area' | 'materia' | 'topico' | 'subtopico') => void;
  addItem: (editalId: string, areaId?: string, materiaId?: string, topicoId?: string, title?: string) => void;
  addCustomRevisionDate: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string) => void;
  removeRevisionDate: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string) => void;
  setNextRevisionDate: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string | null) => void;
  setStudyDate: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string | null) => void;
  updateNota: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, nota: string) => void;
  updateMetricas: (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, acertos: number, erros: number) => void;
  revisions: RevisaoAgendada[];
  completeRevision: (topicoOuSubId: string, dataRevisao: string) => void;
}

const EditalContext = createContext<EditalContextType | undefined>(undefined);

export function EditalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [editais, setEditais] = useState<Edital[]>([]);

  useEffect(() => {
    if (!user) {
      setEditais([]);
      return;
    }
    const q = query(collection(db, "editais"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(changeDoc => {
         const obj = changeDoc.data();
         obj.id = changeDoc.id;
         return obj as Edital;
      });
      setEditais(data);
    }, (err) => {
       handleFirestoreError(err, OperationType.GET, "editais");
    });
    return () => unsubscribe();
  }, [user]);

  const handleUpdate = (editalId: string, updater: (edital: Edital) => void) => {
    if (!user) return;
    setEditais(prev => {
      const newArray = JSON.parse(JSON.stringify(prev)) as Edital[];
      const edital = newArray.find(e => e.id === editalId);
      if (edital) {
        updater(edital);
        setDoc(doc(db, "editais", edital.id), { ...edital, userId: user.uid }).catch(err => {
           handleFirestoreError(err, OperationType.UPDATE, `editais/${edital.id}`);
        });
      }
      return newArray;
    });
  };

  const addEdital = (edital: Edital) => {
    if (!user) return;
    setEditais((prev) => [...prev, edital]);
    setDoc(doc(db, "editais", edital.id), { ...edital, userId: user.uid }).catch(err => {
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
    setEditais(prev => {
      const newArray = JSON.parse(JSON.stringify(prev)) as Edital[];
      for (const edital of newArray) {
        let changed = false;
        for (const area of edital.areas) {
          for (const materia of area.materias) {
            for (const topico of materia.topicos) {
              if (topico.id === itemId) {
                topico.revisoes_agendadas = topico.revisoes_agendadas.filter(r => r !== dataRevisao);
                changed = true;
              }
              for (const sub of topico.subtopicos) {
                if (sub.id === itemId) {
                  sub.revisoes_agendadas = sub.revisoes_agendadas.filter(r => r !== dataRevisao);
                  changed = true;
                }
              }
            }
          }
        }
        if (changed) {
           setDoc(doc(db, "editais", edital.id), { ...edital, userId: user.uid }).catch(err => {
             handleFirestoreError(err, OperationType.UPDATE, `editais/${edital.id}`);
           });
           return newArray;
        }
      }
      return newArray;
    });
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

  const updateItemTitle = (editalId: string, areaId: string, materiaId: string, itemId: string, newTitle: string, type: 'area'|'materia'|'topico'|'subtopico') => {
    handleUpdate(editalId, (edital) => {
      if(type === 'area') {
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
  editais.forEach(edital => {
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

  return (
    <EditalContext.Provider value={{ editais, addEdital, deleteEdital, toggleVisto, updateItemTitle, deleteItem, addItem, addCustomRevisionDate, removeRevisionDate, setNextRevisionDate, setStudyDate, updateNota, updateMetricas, revisions, completeRevision }}>
      {children}
    </EditalContext.Provider>
  );
}

export function useEdital() {
  const context = useContext(EditalContext);
  if (context === undefined) throw new Error("useEdital must be used within EditalProvider");
  return context;
}
