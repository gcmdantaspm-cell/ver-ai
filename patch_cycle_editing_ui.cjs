const fs = require('fs');
let content = fs.readFileSync('src/components/StudyCycles.tsx', 'utf-8');

const original = `<div className="flex items-center gap-1 w-full">
                    <input 
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveCycleTitle(ciclo.id)}
                      className="font-bold text-slate-900 bg-white border border-indigo-200 focus:border-indigo-500 rounded px-2 py-1 w-full outline-none text-sm"
                    />
                    <button onClick={() => saveCycleTitle(ciclo.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Salvar">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingCycleId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded" title="Cancelar">
                      <X className="w-4 h-4" />
                    </button>
                  </div>`;

const replacement = `<div className="flex flex-col gap-2 w-full">
                    <input 
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveCycleTitle(ciclo.id)}
                      className="font-bold text-slate-900 bg-white border border-indigo-200 focus:border-indigo-500 rounded px-2 py-1 w-full outline-none text-sm"
                      placeholder="Nome do ciclo"
                    />
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-slate-400" />
                      <input 
                        type="number"
                        value={editCycleTarget || ''}
                        onChange={(e) => setEditCycleTarget(parseInt(e.target.value) || 0)}
                        className="w-16 text-xs border border-indigo-100 rounded px-1.5 py-1 outline-none font-medium"
                        placeholder="Minutos"
                      />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Carga Horária</span>
                      <div className="ml-auto flex gap-1">
                        <button onClick={() => saveCycleTitle(ciclo.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded bg-emerald-50/50" title="Salvar">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingCycleId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded" title="Cancelar">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>`;

if (content.includes(original)) {
  content = content.replace(original, replacement);
  fs.writeFileSync('src/components/StudyCycles.tsx', content);
  console.log('Patched cycle editing UI');
} else {
  console.log('Original string not found!');
}
