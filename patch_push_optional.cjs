const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf-8');

content = content.replace(/materia\?\.topicos\.push/g, 'materia.topicos.push');
content = content.replace(/topico\?\.subtopicos\.push/g, 'topico.subtopicos.push');

fs.writeFileSync('src/store.tsx', content);
console.log('Patched');
