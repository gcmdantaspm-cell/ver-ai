const fs = require('fs');
let content = fs.readFileSync('src/services/ai.ts', 'utf-8');

const oldInterface = `export interface StudyCycleParams {
  weeklyHours: number;
  cycleHours: number;
  numCycles: number;
  subjectsInfo: {
    nome: string;
    questoes: number;
    peso: number;
  }[];
}`;

const newInterface = `export interface StudyCycleParams {
  weeklyHours: number;
  cycleHours: number;
  numCycles: number;
  subjectsInfo: {
    nome: string;
    questoes: number;
    peso: number;
    tempoManual?: number;
  }[];
}`;

content = content.replace(oldInterface, newInterface);

const oldCalc = `const results = sortedSubjects.map(s => {
    const proportion = totalPoints > 0 ? s.points / totalPoints : 0;
    let subjectMinutes = Math.max(30, Math.round(proportion * totalMinutesAllCycles));
    
    // Round to nearest 5 minutes
    subjectMinutes = Math.max(30, Math.round(subjectMinutes / 5) * 5);`;

const newCalc = `const results = sortedSubjects.map(s => {
    let subjectMinutes;
    if (s.tempoManual && s.tempoManual > 0) {
      subjectMinutes = s.tempoManual * params.numCycles;
    } else {
      const proportion = totalPoints > 0 ? s.points / totalPoints : 0;
      subjectMinutes = Math.max(30, Math.round(proportion * totalMinutesAllCycles));
      
      // Round to nearest 5 minutes
      subjectMinutes = Math.max(30, Math.round(subjectMinutes / 5) * 5);
    }`;

content = content.replace(oldCalc, newCalc);
fs.writeFileSync('src/services/ai.ts', content);
console.log('Patched ai.ts');
