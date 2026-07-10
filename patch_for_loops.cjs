const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf-8');

content = content.replace(/for \(const area of edital\.areas\) \{/g, 'for (const area of edital.areas || []) {');
content = content.replace(/for \(const materia of area\.materias\) \{/g, 'for (const materia of area.materias || []) {');
content = content.replace(/for \(const topico of materia\.topicos\) \{/g, 'for (const topico of materia.topicos || []) {');
content = content.replace(/for \(const sub of topico\.subtopicos\) \{/g, 'for (const sub of topico.subtopicos || []) {');

fs.writeFileSync('src/store.tsx', content);
console.log('Patched');
