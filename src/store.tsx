import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Edital, RevisaoAgendada } from "./types";
import { addDays, isPast, isToday, differenceInDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";

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
  revisions: RevisaoAgendada[];
  completeRevision: (topicoOuSubId: string, dataRevisao: string) => void;
}

const EditalContext = createContext<EditalContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "editais_db";

export function EditalProvider({ children }: { children: ReactNode }) {
  const [editais, setEditais] = useState<Edital[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(editais));
  }, [editais]);

  const addEdital = (edital: Edital) => setEditais((prev) => [...prev, edital]);
  const deleteEdital = (id: string) => setEditais((prev) => prev.filter((e) => e.id !== id));

  // Toggle "Visto" and handle revision scheduling
  const toggleVisto = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string) => {
    setEditais((prev) => {
      const now = new Date().toISOString();
      const newEditais = JSON.parse(JSON.stringify(prev)) as Edital[];
      
      const edital = newEditais.find(e => e.id === editalId);
      const area = edital?.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);
      
      if (!topico) return prev;

      if (subtopicoId) {
        const sub = topico.subtopicos.find(s => s.id === subtopicoId);
        if (sub) {
          sub.visto = !sub.visto;
          if (sub.visto) {
             sub.data_estudo = now;
             // Auto-schedule (1, 7, 15, 30 days)
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

      return newEditais;
    });
  };

  const completeRevision = (itemId: string, dataRevisao: string) => {
    setEditais(prev => {
      const newArray = JSON.parse(JSON.stringify(prev)) as Edital[];
      for (const edital of newArray) {
        for (const area of edital.areas) {
          for (const materia of area.materias) {
            for (const topico of materia.topicos) {
              if (topico.id === itemId) {
                topico.revisoes_agendadas = topico.revisoes_agendadas.filter(r => r !== dataRevisao);
                return newArray;
              }
              for (const sub of topico.subtopicos) {
                if (sub.id === itemId) {
                  sub.revisoes_agendadas = sub.revisoes_agendadas.filter(r => r !== dataRevisao);
                  return newArray;
                }
              }
            }
          }
        }
      }
      return newArray;
    });
  }

  // Add items
  const addItem = (editalId: string, areaId?: string, materiaId?: string, topicoId?: string, title: string = "Novo Item") => {
    setEditais(prev => {
      const ns = JSON.parse(JSON.stringify(prev)) as Edital[];
      const edital = ns.find(e => e.id === editalId);
      if(!edital) return prev;

      if (!areaId) {
        // Add Area
        edital.areas.push({ id: uuidv4(), area: title, materias: [] });
      } else if (!materiaId) {
        // Add Materia
        const area = edital.areas.find(a => a.id === areaId);
        if (area) area.materias.push({ id: uuidv4(), nome: title, topicos: [] });
      } else if (!topicoId) {
        // Add Topico
        const area = edital.areas.find(a => a.id === areaId);
        const materia = area?.materias.find(m => m.id === materiaId);
        if (materia) materia.topicos.push({ id: uuidv4(), titulo: title, visto: false, data_estudo: null, revisoes_agendadas: [], subtopicos: [] });
      } else {
        // Add Subtopico
        const area = edital.areas.find(a => a.id === areaId);
        const materia = area?.materias.find(m => m.id === materiaId);
        const topico = materia?.topicos.find(t => t.id === topicoId);
        if (topico) topico.subtopicos.push({ id: uuidv4(), titulo: title, visto: false, data_estudo: null, revisoes_agendadas: [] });
      }
      return ns;
    });
  };

  const addCustomRevisionDate = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string) => {
    setEditais(prev => {
      const ns = JSON.parse(JSON.stringify(prev)) as Edital[];
      const edital = ns.find(e => e.id === editalId);
      const area = edital?.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);

      if (!topico) return ns;

      if (subtopicoId) {
        const sub = topico.subtopicos.find(s => s.id === subtopicoId);
        if (sub && !sub.revisoes_agendadas.includes(dateStr)) sub.revisoes_agendadas.push(dateStr);
      } else {
        if (!topico.revisoes_agendadas.includes(dateStr)) topico.revisoes_agendadas.push(dateStr);
      }
      return ns;
    });
  };

  const removeRevisionDate = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string) => {
    setEditais(prev => {
      const ns = JSON.parse(JSON.stringify(prev)) as Edital[];
      const edital = ns.find(e => e.id === editalId);
      const area = edital?.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);

      if (!topico) return ns;

      if (subtopicoId) {
        const sub = topico.subtopicos.find(s => s.id === subtopicoId);
        if (sub) {
          sub.revisoes_agendadas = sub.revisoes_agendadas.filter(d => d !== dateStr);
        }
      } else {
        topico.revisoes_agendadas = topico.revisoes_agendadas.filter(d => d !== dateStr);
      }
      return ns;
    });
  };

  const setNextRevisionDate = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string | null) => {
    setEditais(prev => {
      const ns = JSON.parse(JSON.stringify(prev)) as Edital[];
      const edital = ns.find(e => e.id === editalId);
      const area = edital?.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);

      if (!topico) return ns;

      const target = subtopicoId ? topico.subtopicos.find(s => s.id === subtopicoId) : topico;
      if (target) {
        // Keep past revisions, replace future ones
        target.revisoes_agendadas = target.revisoes_agendadas.filter((d: string) => isPast(new Date(d)) && !isToday(new Date(d)));
        if (dateStr) {
          target.revisoes_agendadas.push(dateStr);
        }
      }
      return ns;
    });
  };

  const setStudyDate = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, dateStr: string | null) => {
    setEditais(prev => {
      const ns = JSON.parse(JSON.stringify(prev)) as Edital[];
      const edital = ns.find(e => e.id === editalId);
      const area = edital?.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);

      if (!topico) return ns;

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
      return ns;
    });
  };

  // Update logic (CRUD)
  const updateItemTitle = (editalId: string, areaId: string, materiaId: string, itemId: string, newTitle: string, type: 'area'|'materia'|'topico'|'subtopico') => {
    setEditais(prev => {
      const ns = JSON.parse(JSON.stringify(prev)) as Edital[];
      const edital = ns.find(e => e.id === editalId);
      if(!edital) return prev;
      
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
      return ns;
    });
  }

  const deleteItem = (editalId: string, areaId: string, materiaId: string, itemId: string, type: 'area'|'materia'|'topico'|'subtopico') => {
    setEditais(prev => {
      const ns = JSON.parse(JSON.stringify(prev)) as Edital[];
      const edital = ns.find(e => e.id === editalId);
      if(!edital) return prev;
      
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
      return ns;
    });
  }


  const updateNota = (editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId: string | undefined, nota: string) => {
    setEditais(prev => {
      const ns = JSON.parse(JSON.stringify(prev)) as Edital[];
      const edital = ns.find(e => e.id === editalId);
      const area = edital?.areas.find(a => a.id === areaId);
      const materia = area?.materias.find(m => m.id === materiaId);
      const topico = materia?.topicos.find(t => t.id === topicoId);

      if (!topico) return ns;

      if (subtopicoId) {
        const sub = topico.subtopicos.find(s => s.id === subtopicoId);
        if (sub) {
           sub.notas = nota;
        }
      } else {
        topico.notas = nota;
      }
      return ns;
    });
  };

  // Compute Flattened Revisions Queue
  const revisions: RevisaoAgendada[] = [];
  editais.forEach(edital => {
    edital.areas.forEach(area => {
      area.materias.forEach(materia => {
        materia.topicos.forEach(topico => {
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
          
          topico.subtopicos.forEach(sub => {
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
          });
        });
      });
    });
  });

  // Smart sort: Most delayed first
  revisions.sort((a, b) => b.diasAtraso - a.diasAtraso);

  return (
    <EditalContext.Provider value={{ editais, addEdital, deleteEdital, toggleVisto, updateItemTitle, deleteItem, addItem, addCustomRevisionDate, removeRevisionDate, setNextRevisionDate, setStudyDate, updateNota, revisions, completeRevision }}>
      {children}
    </EditalContext.Provider>
  );
}

export function useEdital() {
  const context = useContext(EditalContext);
  if (context === undefined) throw new Error("useEdital must be used within EditalProvider");
  return context;
}
