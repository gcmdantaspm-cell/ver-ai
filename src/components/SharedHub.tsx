import React, { useState } from "react";
import { useEdital } from "../store";
import { format } from "date-fns";
import { Users, BookOpen, Clock, ChevronRight, Target } from "lucide-react";
import { EditalView } from "./EditalView";
import { StudyCycles } from "./StudyCycles";

export function SharedHub() {
  const { managedEditais, managedCiclos } = useEdital();
  const [selectedEditalId, setSelectedEditalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edital' | 'ciclos'>('edital');

  if (selectedEditalId) {
    const edital = managedEditais.find((e: any) => e.id === selectedEditalId);
    if (edital) {
      const studentCiclos = managedCiclos.filter(c => c.editalId === selectedEditalId);
      
      return (
        <div className="flex flex-col h-full bg-slate-50 relative w-full pt-16 lg:pt-14">
           <div className="absolute top-4 left-4 sm:left-6 z-40 flex items-center gap-4">
             <button onClick={() => setSelectedEditalId(null)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 shadow-sm transition-all uppercase tracking-widest flex items-center gap-2">
                &larr; Voltar
             </button>
             
             <div className="flex bg-slate-200/50 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab('edital')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'edital' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <BookOpen className="w-3.5 h-3.5 inline-block mr-1.5 mb-0.5" /> Edital Verticalizado
                </button>
                <button 
                  onClick={() => setActiveTab('ciclos')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'ciclos' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Target className="w-3.5 h-3.5 inline-block mr-1.5 mb-0.5" /> Ciclos
                </button>
             </div>
           </div>
           
           <div className="flex-1 overflow-hidden" key={activeTab}>
             {activeTab === 'edital' ? (
               <EditalView edital={edital} />
             ) : (
               <StudyCycles customEditais={[edital]} customCiclos={studentCiclos} isManagedMode={true} />
             )}
           </div>
        </div>
      );
    }
  }

  // Grupos por usuário e e-mail
  const groupings: Record<string, { editais: any[], name: string }> = {};

  managedEditais.forEach((ed: any) => {
    const email = ed.copiedByEmail || 'anonimo@example.com';
    const name = ed.copiedByName || 'Usuário Desconhecido';
    if (!groupings[email]) {
      groupings[email] = { name, editais: [] };
    }
    groupings[email].editais.push(ed);
  });

  return (
    <div className="flex-1 px-4 sm:px-8 py-8 overflow-y-auto w-full max-w-7xl mx-auto custom-scrollbar">
      <div className="mb-10">
        <h2 className="text-2xl sm:text-3xl font-display font-medium text-slate-900 tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-800" />
          Meus Compartilhamentos
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-relaxed">
          Gerencie aqui os alunos que importaram os seus editais. Clique no nome do aluno para acessar e editar as tabelas diretamente na conta deles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupings).length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200 border-dashed">
             <Users className="w-12 h-12 text-slate-200 mb-4" />
             <p className="text-sm font-medium text-slate-600">Mande aquele link e faça o bem sem olhar a quem (ou não).</p>
             <p className="text-xs text-slate-400 mt-1">Ninguém importou seus editais ainda.</p>
          </div>
        ) : (
          Object.entries(groupings).map(([email, info]) => (
            <div key={email} className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-blue-900/10">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                 <div>
                    <h3 className="font-bold text-slate-900">{info.name}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3"/> {email}</p>
                 </div>
              </div>
              <div className="p-5 flex-1 space-y-3 bg-white">
                 <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Editais Copiados: {info.editais.length}</h4>
                 {info.editais.map((e: any) => {
                    const cics = managedCiclos.filter((c: any) => c.editalId === e.id);
                    return (
                      <div key={e.id} onClick={() => setSelectedEditalId(e.id)} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-blue-50 cursor-pointer group transition-colors flex items-center justify-between">
                         <div>
                            <p className="text-xs font-bold text-slate-900 line-clamp-1">{e.titulo}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{cics.length} ciclos associados</p>
                         </div>
                         <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 transition-colors shrink-0" />
                      </div>
                    );
                 })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
