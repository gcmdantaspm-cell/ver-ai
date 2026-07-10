const fs = require('fs');
let content = fs.readFileSync('src/services/ai.ts', 'utf-8');

content = content.replace(
  'materias: (area.materias || []).map((materia: any): Materia => ({',
  'materias: (area.materias || []).filter((m: any) => m != null).map((materia: any): Materia => ({'
);

content = content.replace(
  'topicos: (materia.topicos || []).map((topico: any): Topico => ({',
  'topicos: (materia?.topicos || []).filter((t: any) => t != null).map((topico: any): Topico => ({'
);

content = content.replace(
  'subtopicos: (topico.subtopicos || []).map((sub: any): Subtopico => ({',
  'subtopicos: (topico?.subtopicos || []).filter((s: any) => s != null).map((sub: any): Subtopico => ({'
);

fs.writeFileSync('src/services/ai.ts', content);
console.log('Patched');
