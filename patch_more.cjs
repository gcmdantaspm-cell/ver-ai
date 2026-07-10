const fs = require('fs');
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

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  content = content.replace(/\(materia\.topicos/g, '(materia?.topicos');
  content = content.replace(/\(m\.topicos/g, '(m?.topicos');
  content = content.replace(/\(topico\.subtopicos/g, '(topico?.subtopicos');
  content = content.replace(/\(t\.subtopicos/g, '(t?.subtopicos');
  content = content.replace(/\(area\.materias/g, '(area?.materias');
  content = content.replace(/\(a\.materias/g, '(a?.materias');
  content = content.replace(/\(edital\.areas/g, '(edital?.areas');
  content = content.replace(/\(ed\.areas/g, '(ed?.areas');

  content = content.replace(/materia\.topicos/g, 'materia?.topicos');
  content = content.replace(/topico\.subtopicos/g, 'topico?.subtopicos');

  // fix any double question marks
  content = content.replace(/\?\?\./g, '?.');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
}

files.forEach(patchFile);
