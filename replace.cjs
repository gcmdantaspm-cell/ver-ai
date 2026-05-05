const fs = require('fs');

let content = fs.readFileSync('src/components/EditalView.tsx', 'utf8');

// The best way to replace large chunks is to find markers.

const startMarkerRow1 = '{matchFilter && (';
const endMarkerRow1 = ')}';

const startMarkerRow2 = '{/* Subtopics with Indentation */}';
const endMarkerRow2 = '))}';

// Just replace the whole map function return for materias to make things simpler? Yes.
// Let's replace the whole `materia.topicos.map` function content.
// Wait, I will just write a new `TopicosList` component function string and inject it or inject the entire returned map block.

const topicoMapRegex = /\{materia\.topicos\.map\(topico => \{([\s\S]*?)\}\)\}/;

const newCode = `{materia.topicos.map(topico => {
                                 const matchFilter = filter === 'all' || (filter === 'completed' && topico.visto) || (filter === 'pending' && !topico.visto);
                                 const visibleSubs = topico.subtopicos.filter(sub => filter === 'all' || (filter === 'completed' && sub.visto) || (filter === 'pending' && !sub.visto));
                                 
                                 if (!matchFilter && visibleSubs.length === 0) return null;

                                 const nextRevTopico = getNextRevision(topico.revisoes_agendadas);
                                 const isDelayedTopico = nextRevTopico && (isPast(nextRevTopico) && !isToday(nextRevTopico));
                                 const isDueTodayTopico = nextRevTopico && isToday(nextRevTopico);

                                 return (
                                   <div key={topico.id}>
                                      {matchFilter && (
                                        <div className={\`flex flex-col lg:grid lg:grid-cols-12 border-b py-3 px-4 lg:px-6 items-start lg:items-center group transition-colors \${topico.visto ? 'opacity-50 bg-[#0B1120] border-slate-800' : isDelayedTopico ? 'bg-rose-500/10 border-rose-500/20' : isDueTodayTopico ? 'bg-amber-500/10 border-amber-500/20' : 'hover:bg-[#1E293B] border-slate-800'}\`}>
                                            <div className="flex items-start lg:items-center gap-3 w-full lg:col-span-5">
                                              <label className="relative flex items-center justify-center cursor-pointer mt-0.5 lg:mt-0 shrink-0">
                                                <input 
                                                  type="checkbox" 
                                                  checked={topico.visto} 
                                                  className="peer sr-only" 
                                                  onChange={() => toggleVisto(edital.id, area.id, materia.id, topico.id)}
                                                />
                                                <div className="w-5 h-5 border-2 border-slate-600 rounded-md peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                                                   <CheckCircle2 className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                </div>
                                              </label>
                                              <div className={\`font-sans font-medium text-sm truncate pr-2 w-full \${topico.visto ? 'text-slate-500 line-through' : 'text-white'}\`}>
                                                {editingItemId === topico.id ? (
                                                  <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, topico.id, 'topico')} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, topico.id, 'topico')} className="font-mono bg-[#0B1120] text-white px-3 leading-tight py-1 rounded-lg outline-none border border-indigo-500/50 w-full shadow-sm" />
                                                ) : (
                                                  <span onDoubleClick={() => handleEdit(topico.id, topico.titulo)}>{topico.titulo}</span>
                                                )}
                                              </div>
                                            </div>

                                            <div className="mt-3 lg:mt-0 pl-8 lg:pl-0 w-full lg:col-span-7 grid grid-cols-2 lg:grid-cols-7 gap-3 lg:gap-0 items-center">
                                              
                                              <div className="col-span-2 flex items-center justify-start lg:justify-center gap-2">
                                                 <div className="flex items-center bg-[#0B1120] border border-slate-700/50 rounded-lg overflow-hidden shrink-0 shadow-inner">
                                                    <input type="number" placeholder="Ac." min="0" value={topico.acertos ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, undefined, parseInt(e.target.value)||0, topico.erros||0)} className="w-10 bg-transparent text-center text-xs text-emerald-400 py-1.5 outline-none font-mono placeholder:text-slate-600" title="Acertos" />
                                                    <div className="w-px bg-slate-700/50 h-full"></div>
                                                    <input type="number" placeholder="Er." min="0" value={topico.erros ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, undefined, topico.acertos||0, parseInt(e.target.value)||0)} className="w-10 bg-transparent text-center text-xs text-rose-400 py-1.5 outline-none font-mono placeholder:text-slate-600" title="Erros" />
                                                 </div>
                                                 {topico.acertos !== undefined && (topico.acertos > 0 || (topico.erros && topico.erros > 0)) && (
                                                    <div className={\`text-[10px] font-bold \${topico.acertos - (topico.erros||0) > 0 ? 'text-emerald-400' : 'text-rose-400'}\`} title="Rendimento Líquido (Cebraspe)">
                                                      {topico.acertos - (topico.erros||0) > 0 ? '+' : ''}{topico.acertos - (topico.erros||0)}
                                                    </div>
                                                 )}
                                              </div>

                                              <div className="col-span-1 lg:col-span-2 text-slate-500 relative flex justify-start lg:justify-center items-center group/date flex-col lg:flex-row gap-1">
                                                <span className="text-[9px] uppercase font-bold text-slate-600 lg:hidden self-start tracking-wider">Visto Em</span>
                                                <div className="border border-transparent hover:border-slate-700 rounded-lg px-2 py-1 flex gap-1.5 items-center transition-colors font-mono text-xs">
                                                  <span>{topico.data_estudo ? format(new Date(topico.data_estudo), "dd/MM/yyyy") : "—"}</span>
                                                  <CalendarIcon className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover/date:opacity-100" />
                                                </div>
                                                <input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => setStudyDate(edital.id, area.id, materia.id, topico.id, undefined, e.target.value)} />
                                              </div>
                                              
                                              <div className={\`col-span-1 lg:col-span-2 font-mono text-xs relative flex justify-start lg:justify-center items-center group/rev flex-col lg:flex-row gap-1 \${isDelayedTopico ? 'text-rose-400 font-bold' : isDueTodayTopico ? 'text-amber-400 font-bold' : 'text-indigo-400 font-medium'}\`}>
                                                <span className="text-[9px] uppercase font-bold text-slate-600 lg:hidden self-start tracking-wider">Próx. Revisão</span>
                                                <div className="border border-transparent hover:border-slate-700 rounded-lg px-2 py-1 flex gap-1.5 items-center transition-colors">
                                                  <span>{nextRevTopico ? format(nextRevTopico, "dd/MM/yyyy") : "—"}</span>
                                                  <CalendarIcon className="w-3.5 h-3.5 opacity-0 group-hover/rev:opacity-100" />
                                                </div>
                                                <input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => setNextRevisionDate(edital.id, area.id, materia.id, topico.id, undefined, e.target.value)} />
                                              </div>

                                              <div className="col-span-2 lg:col-span-1 text-right flex justify-between lg:justify-end gap-2 items-center w-full mt-2 lg:mt-0">
                                                <div className="flex opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-3 align-middle">
                                                  <button onClick={() => setHistoryModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id })} className="text-slate-500 hover:text-indigo-400" title="Histórico"><History className="w-4 h-4 p-0.5" /></button>
                                                  <button onClick={() => setNotesModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, currentNote: topico.notas || '', title: topico.titulo })} className={\`\${topico.notas ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-amber-400'}\`} title="Anotações"><StickyNote className="w-4 h-4 p-0.5" /></button>
                                                  <button onClick={() => addItem(edital.id, area.id, materia.id, topico.id)} className="text-indigo-500 hover:text-indigo-400" title="Add Subtópico"><Plus className="w-4 h-4 p-0.5" /></button>
                                                  <button onClick={() => handleEdit(topico.id, topico.titulo)} className="text-slate-500 hover:text-slate-300"><Edit2 className="w-4 h-4 p-0.5" /></button>
                                                  <button onClick={() => deleteItem(edital.id, area.id, materia.id, topico.id, 'topico')} className="text-rose-500 hover:text-rose-400"><Trash2 className="w-4 h-4 p-0.5" /></button>
                                                </div>
                                              </div>
                                            </div>
                                        </div>
                                      )}

                                      {/* Subtopics with Indentation */}
                                      {visibleSubs.map(sub => {
                                        const nextRevSub = getNextRevision(sub.revisoes_agendadas);
                                        const isDelayedSub = nextRevSub && (isPast(nextRevSub) && !isToday(nextRevSub));
                                        const isDueTodaySub = nextRevSub && isToday(nextRevSub);
                                        
                                        return (
                                          <div key={sub.id} className={\`flex flex-col lg:grid lg:grid-cols-12 border-b py-2 px-4 lg:px-6 items-start lg:items-center group transition-colors \${sub.visto ? 'opacity-40 bg-[#0B1120] border-slate-800' : isDelayedSub ? 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/10' : isDueTodaySub ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10' : 'bg-[#0f172a]/20 hover:bg-[#1E293B] border-slate-800'}\`}>
                                            <div className="flex items-start lg:items-center gap-3 w-full lg:col-span-5 pl-2 lg:pl-4">
                                              <CornerDownRight className="w-4 h-4 text-slate-600 shrink-0 hidden lg:block" />
                                              <label className="relative flex items-center justify-center cursor-pointer mt-0.5 lg:mt-0 shrink-0">
                                                <input 
                                                  type="checkbox" 
                                                  checked={sub.visto} 
                                                  className="peer sr-only" 
                                                  onChange={() => toggleVisto(edital.id, area.id, materia.id, topico.id, sub.id)}
                                                />
                                                <div className="w-5 h-5 border-2 border-slate-600 rounded-md peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                                                   <CheckCircle2 className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                </div>
                                              </label>
                                              <div className={\`font-sans text-[13px] truncate pr-2 w-full \${sub.visto ? 'text-slate-500 line-through' : 'text-slate-400'}\`}>
                                                {editingItemId === sub.id ? (
                                                  <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(area.id, materia.id, topico.id, 'subtopico', sub.id)} onKeyDown={e => e.key === 'Enter' && saveEdit(area.id, materia.id, topico.id, 'subtopico', sub.id)} className="font-mono bg-[#0B1120] text-white px-3 leading-tight py-1 rounded-lg outline-none border border-indigo-500/50 w-full shadow-sm" />
                                                ) : (
                                                  <span onDoubleClick={() => handleEdit(sub.id, sub.titulo)}>{sub.titulo}</span>
                                                )}
                                              </div>
                                            </div>
                                            
                                            <div className="mt-2 lg:mt-0 pl-12 lg:pl-0 w-full lg:col-span-7 grid grid-cols-2 lg:grid-cols-7 gap-3 lg:gap-0 items-center">
                                              
                                              <div className="col-span-2 flex items-center justify-start lg:justify-center gap-2">
                                                 <div className="flex items-center bg-[#0B1120] border border-slate-700/50 rounded-lg overflow-hidden shrink-0 shadow-inner">
                                                    <input type="number" placeholder="Ac." min="0" value={sub.acertos ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, sub.id, parseInt(e.target.value)||0, sub.erros||0)} className="w-10 bg-transparent text-center text-xs text-emerald-400 py-1.5 outline-none font-mono placeholder:text-slate-600" title="Acertos" />
                                                    <div className="w-px bg-slate-700/50 h-full"></div>
                                                    <input type="number" placeholder="Er." min="0" value={sub.erros ?? ''} onChange={e => updateMetricas(edital.id, area.id, materia.id, topico.id, sub.id, sub.acertos||0, parseInt(e.target.value)||0)} className="w-10 bg-transparent text-center text-xs text-rose-400 py-1.5 outline-none font-mono placeholder:text-slate-600" title="Erros" />
                                                 </div>
                                                 {sub.acertos !== undefined && (sub.acertos > 0 || (sub.erros && sub.erros > 0)) && (
                                                    <div className={\`text-[10px] font-bold \${sub.acertos - (sub.erros||0) > 0 ? 'text-emerald-400' : 'text-rose-400'}\`} title="Rendimento Líquido (Cebraspe)">
                                                      {sub.acertos - (sub.erros||0) > 0 ? '+' : ''}{sub.acertos - (sub.erros||0)}
                                                    </div>
                                                 )}
                                              </div>

                                              <div className="col-span-1 lg:col-span-2 text-slate-500 relative flex justify-start lg:justify-center items-center group/date flex-col lg:flex-row gap-1">
                                                <span className="text-[9px] uppercase font-bold text-slate-600 lg:hidden self-start tracking-wider">Visto Em</span>
                                                <div className="border border-transparent hover:border-slate-700 rounded-lg px-2 py-0.5 flex gap-1.5 items-center transition-colors font-mono text-[11px]">
                                                  <span>{sub.data_estudo ? format(new Date(sub.data_estudo), "dd/MM/yyyy") : "—"}</span>
                                                  <CalendarIcon className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover/date:opacity-100" />
                                                </div>
                                                <input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => setStudyDate(edital.id, area.id, materia.id, topico.id, sub.id, e.target.value)} />
                                              </div>
                                              
                                              <div className={\`col-span-1 lg:col-span-2 font-mono text-[11px] relative flex justify-start lg:justify-center items-center group/rev flex-col lg:flex-row gap-1 \${isDelayedSub ? 'text-rose-400 font-bold' : isDueTodaySub ? 'text-amber-400 font-bold' : 'text-indigo-400 font-medium'}\`}>
                                                <span className="text-[9px] uppercase font-bold text-slate-600 lg:hidden self-start tracking-wider">Próx. Revisão</span>
                                                <div className="border border-transparent hover:border-slate-700 rounded-lg px-2 py-0.5 flex gap-1.5 items-center transition-colors">
                                                  <span>{nextRevSub ? format(nextRevSub, "dd/MM/yyyy") : "—"}</span>
                                                  <CalendarIcon className="w-3.5 h-3.5 opacity-0 group-hover/rev:opacity-100" />
                                                </div>
                                                <input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => setNextRevisionDate(edital.id, area.id, materia.id, topico.id, sub.id, e.target.value)} />
                                              </div>

                                              <div className="col-span-2 lg:col-span-1 text-right flex justify-between lg:justify-end gap-2 items-center w-full mt-2 lg:mt-0">
                                                <div className="flex opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-3 align-middle">
                                                  <button onClick={() => setHistoryModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, subtopicoId: sub.id })} className="text-slate-500 hover:text-indigo-400" title="Histórico"><History className="w-3.5 h-3.5 p-0.5" /></button>
                                                  <button onClick={() => setNotesModal({ isOpen: true, areaId: area.id, materiaId: materia.id, topicoId: topico.id, subtopicoId: sub.id, currentNote: sub.notas || '', title: sub.titulo })} className={\`\${sub.notas ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-amber-400'}\`} title="Anotações"><StickyNote className="w-3.5 h-3.5 p-0.5" /></button>
                                                  <button onClick={() => handleEdit(sub.id, sub.titulo)} className="text-slate-500 hover:text-slate-300"><Edit2 className="w-3.5 h-3.5 p-0.5" /></button>
                                                  <button onClick={() => deleteItem(edital.id, area.id, materia.id, sub.id, 'subtopico', topico.id)} className="text-rose-500 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5 p-0.5" /></button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                   </div>
                                 );
                               })}`;

if (topicoMapRegex.test(content)) {
  content = content.replace(topicoMapRegex, newCode);
  fs.writeFileSync('src/components/EditalView.tsx', content);
  console.log('Success topico map replacement');
} else {
  console.error('Regex not found!');
}

content = fs.readFileSync('src/components/EditalView.tsx', 'utf8');
// Fix accordion header colors and button colors
content = content.replace(
  /className=\{`w-full px-6 py-3 bg-white hover:bg-slate-50 border-b border-slate-100\/50 sticky top-top-9 z-10 flex items-center justify-between transition-colors group`\}/g,
  'className={`w-full px-6 py-3 bg-[#111827] hover:bg-[#1E293B] border-b border-slate-800/80 sticky top-top-9 z-10 flex items-center justify-between transition-colors group`}'
);

content = content.replace(
  /className=\{`flex items-center justify-center w-5 h-5 rounded-md transition-colors \$\{isExpanded \? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`\}/g,
  'className={`flex items-center justify-center w-5 h-5 rounded-md transition-colors ${isExpanded ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-slate-800 text-slate-500 border border-slate-700"}`}'
);

content = content.replace(
  /<button onClick=\{\(\) => toggleMateria\(materia\.id\)\} className="flex items-center gap-3 flex-1 text-xs font-bold text-slate-800 uppercase tracking-widest text-left">/g,
  '<button onClick={() => toggleMateria(materia.id)} className="flex items-center gap-3 flex-1 text-xs font-bold text-slate-300 uppercase tracking-widest text-left">'
);

fs.writeFileSync('src/components/EditalView.tsx', content);
console.log('Completed other replacements');

