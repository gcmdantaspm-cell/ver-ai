const fs = require('fs');

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  content = content.replace(/edital\.areas\.forEach/g, '(edital.areas || []).forEach');
  content = content.replace(/area\.materias\.forEach/g, '(area.materias || []).forEach');
  content = content.replace(/materia\.topicos\.forEach/g, '(materia.topicos || []).forEach');
  content = content.replace(/topico\.subtopicos\.forEach/g, '(topico.subtopicos || []).forEach');

  content = content.replace(/edital\.areas\.map/g, '(edital.areas || []).map');
  content = content.replace(/area\.materias\.map/g, '(area.materias || []).map');
  content = content.replace(/materia\.topicos\.map/g, '(materia.topicos || []).map');
  content = content.replace(/topico\.subtopicos\.map/g, '(topico.subtopicos || []).map');

  content = content.replace(/edital\.areas\.filter/g, '(edital.areas || []).filter');
  content = content.replace(/area\.materias\.filter/g, '(area.materias || []).filter');
  content = content.replace(/materia\.topicos\.filter/g, '(materia.topicos || []).filter');
  content = content.replace(/topico\.subtopicos\.filter/g, '(topico.subtopicos || []).filter');
  
  content = content.replace(/edital\.areas\.find/g, '(edital.areas || []).find');
  content = content.replace(/area\.materias\.find/g, '(area.materias || []).find');
  content = content.replace(/materia\.topicos\.find/g, '(materia.topicos || []).find');
  content = content.replace(/topico\.subtopicos\.find/g, '(topico.subtopicos || []).find');
  
  content = content.replace(/edital\.areas\.flatMap/g, '(edital.areas || []).flatMap');
  content = content.replace(/area\.materias\.flatMap/g, '(area.materias || []).flatMap');
  content = content.replace(/materia\.topicos\.flatMap/g, '(materia.topicos || []).flatMap');
  content = content.replace(/topico\.subtopicos\.flatMap/g, '(topico.subtopicos || []).flatMap');
  
  // also handle nullable cases like `materia?.topicos` or `topico?.subtopicos` 
  content = content.replace(/materia\?\.topicos\.find/g, '(materia?.topicos || []).find');
  content = content.replace(/topico\?\.subtopicos\.find/g, '(topico?.subtopicos || []).find');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
}

const files = [
  'src/components/Dashboard.tsx',
  'src/components/EditalView.tsx',
  'src/components/RevisaoSugestoes.tsx',
  'src/components/CartoesErrosView.tsx',
  'src/components/CartoesView.tsx',
  'src/components/StudyCycles.tsx',
  'src/components/SharedHub.tsx',
  'src/store.tsx',
  'src/services/ai.ts'
];

files.forEach(patchFile);
