const fs = require('fs');
let content = fs.readFileSync('src/components/StudyCycles.tsx', 'utf-8');

const original = `<div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                          {subjectsParams.map((param, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
                              <span className="flex-1 text-[11px] font-medium text-slate-700 truncate">{param.nome}</span>
                              <div className="flex gap-1 items-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-[8px] text-slate-400 font-bold">QUESTÕES</span>
                                  <input 
                                    type="number"
                                    value={param.questoes}
                                    onChange={(e) => handleUpdateSubjectParam(idx, 'questoes', parseInt(e.target.value) || 0)}
                                    className="w-12 text-[10px] border border-slate-100 rounded p-1 text-center font-bold"
                                  />
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-[8px] text-slate-400 font-bold">PESO</span>
                                  <input 
                                    type="number"
                                    value={param.peso}
                                    onChange={(e) => handleUpdateSubjectParam(idx, 'peso', parseInt(e.target.value) || 0)}
                                    className="w-10 text-[10px] border border-slate-100 rounded p-1 text-center font-bold"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>`;

const replacement = `<div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                          {subjectsParams.map((param, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
                              <input 
                                type="text"
                                value={param.nome}
                                onChange={(e) => handleUpdateSubjectNameParam(idx, e.target.value)}
                                className="flex-1 text-[11px] font-medium text-slate-700 bg-transparent outline-none truncate border-b border-transparent focus:border-slate-300 transition-colors"
                                placeholder="Nome da matéria"
                              />
                              <div className="flex gap-1 items-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-[8px] text-slate-400 font-bold" title="Peso indireto via questões">QTD</span>
                                  <input 
                                    type="number"
                                    value={param.questoes}
                                    onChange={(e) => handleUpdateSubjectParam(idx, 'questoes', parseInt(e.target.value) || 0)}
                                    className="w-10 text-[10px] border border-slate-100 rounded p-1 text-center font-bold"
                                    title="Peso via Questões"
                                  />
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-[8px] text-slate-400 font-bold" title="Peso / Multiplicador">PESO</span>
                                  <input 
                                    type="number"
                                    value={param.peso}
                                    onChange={(e) => handleUpdateSubjectParam(idx, 'peso', parseInt(e.target.value) || 0)}
                                    className="w-10 text-[10px] border border-slate-100 rounded p-1 text-center font-bold"
                                    title="Multiplicador"
                                  />
                                </div>
                                <button 
                                  onClick={() => handleRemoveSubjectParam(idx)}
                                  className="ml-1 p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors self-end"
                                  title="Remover matéria do ciclo"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={handleAddSubjectParam}
                          className="mt-2 w-full py-2 flex items-center justify-center gap-1.5 border border-dashed border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all font-bold text-[10px] uppercase tracking-wider"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar Matéria Extra
                        </button>`;

if (content.includes(original)) {
  content = content.replace(original, replacement);
  fs.writeFileSync('src/components/StudyCycles.tsx', content);
  console.log('Patched modal list');
} else {
  console.log('Could not find original block in modal');
}
