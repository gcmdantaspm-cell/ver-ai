const fs = require('fs');
const content = fs.readFileSync('src/components/EditalView.tsx', 'utf-8');

const oldRevisionsList = `function RevisionsList({ item, editalId, areaId, materiaId, topicoId, subtopicoId }: { item: any, editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string }) {
  const { undoRevision, addCustomRevisionDate, removeRevisionDate } = useEdital();

  const revs = [];
  const concluidas = item.revisoes_concluidas || 0;
  const agendadas = (item.revisoes_agendadas || []).slice().sort((a: any, b: any) => new Date(a).getTime() - new Date(b).getTime());
  
  for (let i = 0; i < 8; i++) {
    if (i < concluidas) {
      revs.push({ label: \`R\${i+1}\`, status: 'done', date: null });
    } else {
      const agIndex = i - concluidas;
      if (agIndex < agendadas.length) {
         const date = new Date(agendadas[agIndex]);
         const isP = isPast(date) && !isToday(date);
         const isT = isToday(date);
         let status = 'future';
         if (isP) status = 'late';
         else if (isT) status = 'today';
         revs.push({ label: \`R\${i+1}\`, status, date, rawDate: agendadas[agIndex] });
      } else {
         revs.push({ label: \`R\${i+1}\`, status: 'empty', date: null });
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1.5 w-full">
      {revs.map((r, idx) => {
        let colorClass = 'bg-slate-100 text-slate-400 border-slate-200';
        if (r.status === 'done') colorClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        else if (r.status === 'late') colorClass = 'bg-rose-500/10 text-rose-600 border-rose-500/20';
        else if (r.status === 'today') colorClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        else if (r.status === 'future') colorClass = 'bg-blue-900/10 text-blue-800 border-blue-900/20';
        
        if (item.visto) {
          if (r.status === 'done') colorClass = 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30';
          else if (r.status === 'late') colorClass = 'bg-rose-400/20 text-rose-300 border-rose-400/30';
          else if (r.status === 'today') colorClass = 'bg-amber-400/20 text-amber-300 border-amber-400/30';
          else if (r.status === 'future') colorClass = 'bg-white/20 text-blue-200 border-white/30';
          else colorClass = 'bg-white/5 text-white/30 border-white/10';
        }

        return (
          <div key={idx} className={\`flex items-center text-[8px] sm:text-[9px] border rounded overflow-hidden shadow-sm \${colorClass}\`}>
            <div className={\`px-1 py-0.5 font-bold border-r \${item.visto ? 'border-inherit' : 'border-inherit'}\`}>
              {r.label}
            </div>
            <div className={\`px-1 py-0.5 font-mono flex items-center \${r.status === 'empty' ? 'opacity-50' : ''}\`}>
              {r.status === 'done' ? (
                <button 
                  onClick={() => {
                     if(window.confirm("Desfazer esta revisão?")) {
                        undoRevision(item.id);
                     }
                  }}
                  className="hover:opacity-75 outline-none"
                  title="Desfazer revisão"
                >
                  OK
                </button>
              ) : (
                <div className="relative flex items-center gap-0.5 group/date">
                  <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
                    <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full z-10" onChange={e => {
                      if(e.target.value) {
                         const newDateStr = new Date(e.target.value + 'T12:00:00').toISOString();
                         if (r.date) removeRevisionDate(editalId, areaId, materiaId, topicoId, subtopicoId, r.rawDate);
                         addCustomRevisionDate(editalId, areaId, materiaId, topicoId, subtopicoId, newDateStr);
                      }
                    }} />
                    <span>{r.date ? format(r.date, "dd/MM") : '—'}</span>
                  </div>
                  {r.date && (
                    <button 
                      className="opacity-0 group-hover/date:opacity-100 text-rose-500 hover:text-rose-600 z-20 relative transition-opacity ml-0.5" 
                      title="Remover data"
                      onClick={(e) => {
                         e.stopPropagation();
                         removeRevisionDate(editalId, areaId, materiaId, topicoId, subtopicoId, r.rawDate);
                      }}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}`;

const newRevisionsList = `function RevisionsList({ item, editalId, areaId, materiaId, topicoId, subtopicoId }: { item: any, editalId: string, areaId: string, materiaId: string, topicoId: string, subtopicoId?: string }) {
  const { undoRevision, addCustomRevisionDate, removeRevisionDate, completeRevision } = useEdital();
  const [selectedRev, setSelectedRev] = useState<any>(null);

  const revs = [];
  const concluidas = item.revisoes_concluidas || 0;
  const agendadas = (item.revisoes_agendadas || []).slice().sort((a: any, b: any) => new Date(a).getTime() - new Date(b).getTime());
  
  for (let i = 0; i < 8; i++) {
    if (i < concluidas) {
      revs.push({ label: \`R\${i+1}\`, status: 'done', date: null });
    } else {
      const agIndex = i - concluidas;
      if (agIndex < agendadas.length) {
         const date = new Date(agendadas[agIndex]);
         const isP = isPast(date) && !isToday(date);
         const isT = isToday(date);
         let status = 'future';
         if (isP) status = 'late';
         else if (isT) status = 'today';
         revs.push({ label: \`R\${i+1}\`, status, date, rawDate: agendadas[agIndex] });
      } else {
         revs.push({ label: \`R\${i+1}\`, status: 'empty', date: null });
      }
    }
  }

  return (
    <>
    <div className="flex flex-wrap items-center gap-1 mt-1.5 w-full relative">
      {revs.map((r, idx) => {
        let colorClass = 'bg-slate-100 text-slate-400 border-slate-200';
        if (r.status === 'done') colorClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        else if (r.status === 'late') colorClass = 'bg-rose-500/10 text-rose-600 border-rose-500/20';
        else if (r.status === 'today') colorClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        else if (r.status === 'future') colorClass = 'bg-blue-900/10 text-blue-800 border-blue-900/20';
        
        if (item.visto) {
          if (r.status === 'done') colorClass = 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30';
          else if (r.status === 'late') colorClass = 'bg-rose-400/20 text-rose-300 border-rose-400/30';
          else if (r.status === 'today') colorClass = 'bg-amber-400/20 text-amber-300 border-amber-400/30';
          else if (r.status === 'future') colorClass = 'bg-white/20 text-blue-200 border-white/30';
          else colorClass = 'bg-white/5 text-white/30 border-white/10';
        }

        return (
          <div key={idx} className={\`flex items-center text-[8px] sm:text-[9px] border rounded overflow-hidden shadow-sm \${colorClass}\`}>
            <div className={\`px-1 py-0.5 font-bold border-r \${item.visto ? 'border-inherit' : 'border-inherit'}\`}>
              {r.label}
            </div>
            <div className={\`px-1 py-0.5 font-mono flex items-center \${r.status === 'empty' ? 'opacity-50' : ''}\`}>
              {r.status === 'done' ? (
                <button 
                  onClick={() => {
                     if(window.confirm("Desfazer esta revisão?")) {
                        undoRevision(item.id);
                     }
                  }}
                  className="hover:opacity-75 outline-none"
                  title="Desfazer revisão"
                >
                  OK
                </button>
              ) : (
                <div className="relative flex items-center gap-0.5 group/date">
                  <div 
                    className="relative cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      if (r.status !== 'empty') {
                        setSelectedRev(r);
                      }
                    }}
                  >
                    {r.status === 'empty' && (
                      <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full z-10" onChange={e => {
                        if(e.target.value) {
                           const newDateStr = new Date(e.target.value + 'T12:00:00').toISOString();
                           addCustomRevisionDate(editalId, areaId, materiaId, topicoId, subtopicoId, newDateStr);
                        }
                      }} />
                    )}
                    <span>{r.date ? format(r.date, "dd/MM") : '—'}</span>
                  </div>
                  {r.date && (
                    <button 
                      className="opacity-0 group-hover/date:opacity-100 text-rose-500 hover:text-rose-600 z-20 relative transition-opacity ml-0.5" 
                      title="Remover data"
                      onClick={(e) => {
                         e.stopPropagation();
                         removeRevisionDate(editalId, areaId, materiaId, topicoId, subtopicoId, r.rawDate);
                      }}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>

    {/* Modal de Revisão */}
    {selectedRev && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col relative animate-in zoom-in-95 duration-200">
          <button 
            onClick={() => setSelectedRev(null)}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
             <CalendarIcon className="w-6 h-6 text-indigo-600" />
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-2">Revisão {selectedRev.label}</h3>
          <p className="text-sm text-slate-500 mb-6">Você já concluiu esta revisão?</p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                 completeRevision(item.id, selectedRev.rawDate);
                 setSelectedRev(null);
              }}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-5 h-5" />
              Sim, concluída
            </button>
            
            <div className="relative">
              <button className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all">
                <CalendarIcon className="w-5 h-5" />
                Alterar Data
              </button>
              <input type="date" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => {
                if(e.target.value) {
                   const newDateStr = new Date(e.target.value + 'T12:00:00').toISOString();
                   if (selectedRev.date) removeRevisionDate(editalId, areaId, materiaId, topicoId, subtopicoId, selectedRev.rawDate);
                   addCustomRevisionDate(editalId, areaId, materiaId, topicoId, subtopicoId, newDateStr);
                   setSelectedRev(null);
                }
              }} />
            </div>
            
            <button 
              onClick={() => setSelectedRev(null)}
              className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 px-4 rounded-xl transition-all"
            >
              Ainda não
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}`

const newFileContent = content.replace(oldRevisionsList, newRevisionsList);
if (newFileContent === content) {
    console.error("Replacement failed!");
} else {
    fs.writeFileSync('src/components/EditalView.tsx', newFileContent);
    console.log("Success");
}
