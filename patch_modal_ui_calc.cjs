const fs = require('fs');
let content = fs.readFileSync('src/components/StudyCycles.tsx', 'utf-8');

const oldHeader = `<div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Peso e Questões por Matéria</div>
<p className="text-[10px] text-slate-400 mb-3 leading-tight">Aumente o peso ou o número de questões para que a IA destine <b>mais tempo</b> a essa matéria. Remova ou adicione matérias livremente.</p>`;

const newHeader = `<div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tempo por Matéria (por Ciclo)</div>
<p className="text-[10px] text-slate-400 mb-3 leading-tight">Ajuste o peso/questões para recalcular automaticamente o tempo ideal, ou digite o tempo exato (minutos) que você quer alocar.</p>`;

content = content.replace(oldHeader, newHeader);

const oldList = `<div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                          {subjectsParams.map((param, idx) => (`;

const calcLogic = `
const totalMinutesAllCycles = numCycles * cycleHours * 60;
const totalPoints = subjectsParams.reduce((acc, s) => acc + (s.questoes * s.peso), 0);
`;

const newList = `
${calcLogic}
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                          {subjectsParams.map((param, idx) => {
                            const proportion = totalPoints > 0 ? (param.questoes * param.peso) / totalPoints : 0;
                            let calcTotalMins = Math.max(30, Math.round(proportion * totalMinutesAllCycles));
                            calcTotalMins = Math.max(30, Math.round(calcTotalMins / 5) * 5);
                            const calcPerCycle = Math.round(calcTotalMins / (numCycles || 1));
                            const displayTime = param.tempoManual || calcPerCycle;
                            return (
`;

content = content.replace(oldList, newList);

const oldRowEnd = `</button>
                              </div>
                            </div>
                          ))}
                        </div>`;

const newRowEnd = `</button>
                              </div>
                            </div>
                          );
                          })}
                        </div>`;

content = content.replace(oldRowEnd, newRowEnd);

const oldInputs = `<div className="flex gap-1 items-center">
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
                                </div>`;

const newInputs = `<div className="flex gap-1 items-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-[8px] text-slate-400 font-bold" title="Peso indireto via questões">QTD</span>
                                  <input 
                                    type="number"
                                    value={param.questoes}
                                    onChange={(e) => {
                                      handleUpdateSubjectParam(idx, 'questoes', parseInt(e.target.value) || 0);
                                      handleUpdateSubjectParam(idx, 'tempoManual', 0); // reset manual if they tweak weights
                                    }}
                                    className="w-10 text-[10px] border border-slate-100 rounded p-1 text-center font-bold"
                                    title="Peso via Questões"
                                  />
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-[8px] text-slate-400 font-bold" title="Peso / Multiplicador">PESO</span>
                                  <input 
                                    type="number"
                                    value={param.peso}
                                    onChange={(e) => {
                                      handleUpdateSubjectParam(idx, 'peso', parseInt(e.target.value) || 0);
                                      handleUpdateSubjectParam(idx, 'tempoManual', 0); // reset manual if they tweak weights
                                    }}
                                    className="w-10 text-[10px] border border-slate-100 rounded p-1 text-center font-bold"
                                    title="Multiplicador"
                                  />
                                </div>
                                <div className="flex flex-col items-center ml-1">
                                  <span className="text-[8px] text-indigo-500 font-bold" title="Tempo final por ciclo">MINUTOS</span>
                                  <input 
                                    type="number"
                                    value={displayTime}
                                    onChange={(e) => handleUpdateSubjectParam(idx, 'tempoManual', parseInt(e.target.value) || 0)}
                                    className="w-12 text-[10px] border border-indigo-200 bg-indigo-50 text-indigo-700 rounded p-1 text-center font-bold"
                                    title="Tempo em minutos (Sobrescreve o cálculo)"
                                  />
                                </div>`;

content = content.replace(oldInputs, newInputs);

fs.writeFileSync('src/components/StudyCycles.tsx', content);
console.log('Patched UI calc');
