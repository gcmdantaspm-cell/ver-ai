const fs = require('fs');
let content = fs.readFileSync('src/components/StudyCycles.tsx', 'utf-8');

content = content.replace(
  'const result = await generateStudyCycleAI(edital.titulo, allMaterias, {',
  'const result = await generateStudyCycleAI(edital.titulo, subjectsParams.map(s => s.nome), {'
);

fs.writeFileSync('src/components/StudyCycles.tsx', content);
console.log('Patched generate AI call');
