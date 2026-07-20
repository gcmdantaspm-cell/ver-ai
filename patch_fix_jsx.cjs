const fs = require('fs');
let content = fs.readFileSync('src/components/StudyCycles.tsx', 'utf-8');

const errorBlock = `const totalMinutesAllCycles = numCycles * cycleHours * 60;
const totalPoints = subjectsParams.reduce((acc, s) => acc + (s.questoes * s.peso), 0);

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                          {subjectsParams.map((param, idx) => {
                            const proportion = totalPoints > 0 ? (param.questoes * param.peso) / totalPoints : 0;
                            let calcTotalMins = Math.max(30, Math.round(proportion * totalMinutesAllCycles));
                            calcTotalMins = Math.max(30, Math.round(calcTotalMins / 5) * 5);
                            const calcPerCycle = Math.round(calcTotalMins / (numCycles || 1));
                            const displayTime = param.tempoManual || calcPerCycle;
                            return (`;

const fixedBlock = `<div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                          {(() => {
                            const totalMinutesAllCycles = numCycles * cycleHours * 60;
                            const totalPoints = subjectsParams.reduce((acc, s) => acc + (s.questoes * s.peso), 0);
                            return subjectsParams.map((param, idx) => {
                              const proportion = totalPoints > 0 ? (param.questoes * param.peso) / totalPoints : 0;
                              let calcTotalMins = Math.max(30, Math.round(proportion * totalMinutesAllCycles));
                              calcTotalMins = Math.max(30, Math.round(calcTotalMins / 5) * 5);
                              const calcPerCycle = Math.round(calcTotalMins / (numCycles || 1));
                              const displayTime = param.tempoManual || calcPerCycle;
                              return (`;

content = content.replace(errorBlock, fixedBlock);

const endBlock = `</button>
                              </div>
                            </div>
                          );
                          })}
                        </div>`;

const endFixedBlock = `</button>
                              </div>
                            </div>
                          );
                          })
                          })()}
                        </div>`;

content = content.replace(endBlock, endFixedBlock);

fs.writeFileSync('src/components/StudyCycles.tsx', content);
console.log('Fixed JSX');
