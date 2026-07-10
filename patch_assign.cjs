const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf-8');

content = content.replace(/materia\?\.topicos =/g, 'materia.topicos =');
content = content.replace(/topico\?\.subtopicos =/g, 'topico.subtopicos =');
content = content.replace(/area\?\.materias =/g, 'area.materias =');
content = content.replace(/edital\?\.areas =/g, 'edital.areas =');

fs.writeFileSync('src/store.tsx', content);
console.log('Patched');
