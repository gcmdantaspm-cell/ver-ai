const fs = require('fs');
function patchFile(file) {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  content = content.replace(/m\.topicos\.forEach/g, '(m.topicos || []).forEach');
  content = content.replace(/mat\.topicos\.forEach/g, '(mat.topicos || []).forEach');
  content = content.replace(/m\.topicos\.find/g, '(m.topicos || []).find');
  content = content.replace(/mat\.topicos\.find/g, '(mat.topicos || []).find');
  content = content.replace(/materiaObj\?\.topicos\.map/g, '(materiaObj?.topicos || []).map');
  content = content.replace(/materiaObj\?\.topicos\.find/g, '(materiaObj?.topicos || []).find');

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
