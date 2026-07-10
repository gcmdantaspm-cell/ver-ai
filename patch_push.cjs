const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf-8');

content = content.replace(
  /if \(area\) area\.materias\.push/g,
  'if (area) { if (!area.materias) area.materias = []; area.materias.push'
);

content = content.replace(
  /if \(materia\) materia\.topicos\.push/g,
  'if (materia) { if (!materia.topicos) materia.topicos = []; materia.topicos.push'
);

content = content.replace(
  /if \(topico\) topico\.subtopicos\.push/g,
  'if (topico) { if (!topico.subtopicos) topico.subtopicos = []; topico.subtopicos.push'
);

// close the brackets
content = content.replace(
  'area.materias.push({ id: uuidv4(), nome: title, topicos: [] });',
  'area.materias.push({ id: uuidv4(), nome: title, topicos: [] }); }'
);

content = content.replace(
  'materia.topicos.push({ id: uuidv4(), titulo: title, visto: false, data_estudo: null, revisoes_agendadas: [], subtopicos: [] });',
  'materia.topicos.push({ id: uuidv4(), titulo: title, visto: false, data_estudo: null, revisoes_agendadas: [], subtopicos: [] }); }'
);

content = content.replace(
  'topico.subtopicos.push({ id: uuidv4(), titulo: title, visto: false, data_estudo: null, revisoes_agendadas: [] });',
  'topico.subtopicos.push({ id: uuidv4(), titulo: title, visto: false, data_estudo: null, revisoes_agendadas: [] }); }'
);

fs.writeFileSync('src/store.tsx', content);
console.log('Patched');
