const fs = require('fs');

// 1. Patch store.tsx
let storeContent = fs.readFileSync('src/store.tsx', 'utf-8');

const oldUpdateTitle = `      } else if (type === 'subtopico') {
        const m = (edital?.areas || []).find(a => a.id === areaId)?.materias.find(m => m.id === materiaId);
        const t = m?.topicos.find(t => t.subtopicos.some(s => s.id === itemId));
        const sub = (t?.subtopicos || []).find(s => s.id === itemId);
        if(sub) sub.titulo = newTitle;
      }`;

const newUpdateTitle = `      } else if (type === 'subtopico') {
        const m = (edital?.areas || []).find(a => a.id === areaId)?.materias.find(m => m.id === materiaId);
        const t = m?.topicos.find(t => t.subtopicos.some(s => s.id === itemId));
        const sub = (t?.subtopicos || []).find(s => s.id === itemId);
        if(sub) sub.titulo = newTitle;
      } else if (type === 'subsubtopico') {
        const m = (edital?.areas || []).find(a => a.id === areaId)?.materias.find(m => m.id === materiaId);
        for (const t of m?.topicos || []) {
          for (const s of t.subtopicos || []) {
            const subsub = (s.subitens || []).find(ss => ss.id === itemId);
            if (subsub) {
              subsub.titulo = newTitle;
              break;
            }
          }
        }
      }`;

storeContent = storeContent.replace(oldUpdateTitle, newUpdateTitle);
// Update type signature of updateItemTitle in store.tsx if needed
storeContent = storeContent.replace(
  "type: 'edital'|'area'|'materia'|'topico'|'subtopico'",
  "type: 'edital'|'area'|'materia'|'topico'|'subtopico'|'subsubtopico'"
);
storeContent = storeContent.replace(
  "type: 'edital' | 'area' | 'materia' | 'topico' | 'subtopico'",
  "type: 'edital' | 'area' | 'materia' | 'topico' | 'subtopico' | 'subsubtopico'"
);

fs.writeFileSync('src/store.tsx', storeContent);
console.log("Patched store.tsx");

// 2. Patch EditalView.tsx
let editalContent = fs.readFileSync('src/components/EditalView.tsx', 'utf-8');

// Update saveEdit function signature
editalContent = editalContent.replace(
  "type: 'edital' | 'area' | 'materia' | 'topico' | 'subtopico'",
  "type: 'edital' | 'area' | 'materia' | 'topico' | 'subtopico' | 'subsubtopico'"
);

// Replace subsubtopicos block in EditalView.tsx
const oldSubsubBlock = `                                                      {/* SubSubtopicos */}
                                                      {(sub.subitens || []).length > 0 && (
                                                        <div className="pl-6 pr-2 py-1 space-y-1">
                                                          {(sub.subitens || []).map((subsub) => (
                                                            <div key={subsub.id} className={\`flex flex-col lg:flex-row items-start lg:items-center py-1.5 px-2 lg:px-4 rounded-md border-l-2 \${subsub.visto ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-l-blue-300 shadow-md transform scale-[1.01] transition-all' : 'bg-slate-50/50 hover:bg-slate-100 border-l-slate-200'} group/subsub transition-all\`}>
                                                              <div className="flex items-center gap-2 lg:w-1/2 w-full">
                                                                <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                                                                  <input type="checkbox" checked={subsub.visto} className="peer sr-only" onChange={() => toggleVisto(edital.id, area.id, materia.id, topico.id, sub.id, subsub.id)} />
                                                                  <div className={\`w-2.5 h-2.5 border rounded-[2px] transition-all flex items-center justify-center \${subsub.visto ? 'bg-white border-white' : 'border-slate-300 peer-checked:bg-blue-500 peer-checked:border-blue-500'}\`}>
                                                                    <Check className={\`w-2 h-2 transition-opacity \${subsub.visto ? 'opacity-100 text-blue-500' : 'opacity-0 peer-checked:opacity-100 text-white'}\`} strokeWidth={3} />
                                                                  </div>
                                                                </label>
                                                                <div className={\`text-[10px] flex-1 break-words w-full \${subsub.visto ? 'text-white opacity-90' : 'text-slate-500'}\`}>
                                                                  <div className="flex items-center gap-2 w-full">
                                                                    {editingItemId === subsub.id ? (
                                                                      <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, topico.id, 'subsubtopico', subsub.id)} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, topico.id, 'subsubtopico', subsub.id)} className={\`bg-transparent w-full outline-none \${subsub.visto ? 'text-white' : 'text-slate-900'}\`} />
                                                                    ) : (
                                                                      <span onDoubleClick={() => handleEdit(subsub.id, subsub.titulo)} className="cursor-text line-clamp-1 hover:line-clamp-none">{subsub.titulo}</span>
                                                                    )}
                                                                  </div>
                                                                </div>
                                                              </div>
                                                              <div className="w-full lg:col-span-6 flex items-center justify-end pl-6 sm:pl-4 lg:pl-0 mt-1 lg:mt-0">
                                                                <div className="lg:col-span-1 flex justify-end gap-0.5 opacity-100 lg:opacity-0 group-hover/subsub:opacity-100 transition-opacity">
                                                                  <button onClick={() => safeConfirm("Excluir item?") && deleteItem(edital.id, area.id, materia.id, subsub.id, 'subsubtopico', topico.id)} className={\`p-1 \${subsub.visto ? 'text-white/60 hover:text-rose-300' : 'text-slate-400 hover:text-rose-500'}\`}><Trash2 className="w-2.5 h-2.5" /></button>
                                                                </div>
                                                              </div>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      )}`;

const newSubsubBlock = `                                                      {/* SubSubtopicos */}
                                                      {(sub.subitens || []).length > 0 && (
                                                        <div className="w-full col-span-12 lg:col-span-12 pl-6 sm:pl-10 pr-2 py-1.5 space-y-1.5 mt-1">
                                                          {(sub.subitens || []).map((subsub) => (
                                                            <div 
                                                              key={subsub.id} 
                                                              className={\`flex items-center justify-between py-1.5 px-3 rounded-lg border-l-2 transition-all \${
                                                                subsub.visto 
                                                                  ? 'bg-blue-800/90 border-l-sky-400 text-white shadow-sm' 
                                                                  : (sub.visto ? 'bg-white/10 hover:bg-white/20 border-l-white/40 text-white' : 'bg-slate-50 hover:bg-slate-100/80 border-l-slate-300 text-slate-700')
                                                              } group/subsub\`}>
                                                              <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                                                                <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                                                                  <input 
                                                                    type="checkbox" 
                                                                    checked={subsub.visto} 
                                                                    className="peer sr-only" 
                                                                    onChange={() => toggleVisto(edital.id, area.id, materia.id, topico.id, sub.id, subsub.id)} 
                                                                  />
                                                                  <div className={\`w-3 h-3 border rounded-sm transition-all flex items-center justify-center \${
                                                                    subsub.visto ? 'bg-blue-500 border-blue-500' : 'border-slate-300 peer-checked:bg-blue-500 peer-checked:border-blue-500'
                                                                  }\`}>
                                                                    <Check className={\`w-2 h-2 transition-opacity \${subsub.visto ? 'opacity-100 text-white' : 'opacity-0 peer-checked:opacity-100 text-white'}\`} strokeWidth={3} />
                                                                  </div>
                                                                </label>
                                                                <div className="text-[10px] font-medium flex-1 break-words min-w-0">
                                                                  {editingItemId === subsub.id ? (
                                                                    <input 
                                                                      autoFocus 
                                                                      value={editValue} 
                                                                      onChange={e => setEditValue(e.target.value)} 
                                                                      onBlur={() => saveEdit(area.id, materia.id, topico.id, 'subsubtopico', subsub.id)} 
                                                                      onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, topico.id, 'subsubtopico', subsub.id)} 
                                                                      className={\`bg-transparent w-full outline-none font-semibold \${subsub.visto || sub.visto ? 'text-white' : 'text-slate-900'}\`} 
                                                                    />
                                                                  ) : (
                                                                    <span 
                                                                      onDoubleClick={() => handleEdit(subsub.id, subsub.titulo)} 
                                                                      className="cursor-text hover:underline leading-snug"
                                                                    >
                                                                      {subsub.titulo}
                                                                    </span>
                                                                  )}
                                                                </div>
                                                              </div>
                                                              <div className="flex items-center gap-1 shrink-0 opacity-100 lg:opacity-0 group-hover/subsub:opacity-100 transition-opacity">
                                                                <button 
                                                                  onClick={() => safeConfirm("Excluir item?") && deleteItem(edital.id, area.id, materia.id, subsub.id, 'subsubtopico', topico.id)} 
                                                                  className={\`p-1 rounded hover:bg-rose-500/10 \${subsub.visto || sub.visto ? 'text-white/70 hover:text-rose-300' : 'text-slate-400 hover:text-rose-500'}\`} 
                                                                  title="Excluir assunto"
                                                                >
                                                                  <Trash2 className="w-3 h-3" />
                                                                </button>
                                                              </div>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      )}`;

editalContent = editalContent.replace(oldSubsubBlock, newSubsubBlock);
fs.writeFileSync('src/components/EditalView.tsx', editalContent);
console.log("Patched EditalView.tsx");
