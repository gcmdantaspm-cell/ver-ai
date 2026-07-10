const fs = require('fs');

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  content = content.replace(/area\?\.materias\.find/g, '(area?.materias || []).find');
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
