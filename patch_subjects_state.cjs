const fs = require('fs');
let content = fs.readFileSync('src/components/StudyCycles.tsx', 'utf-8');

// Update state type
content = content.replace(
  'const [subjectsParams, setSubjectsParams] = useState<{nome: string, questoes: number, peso: number}[]>([]);',
  'const [subjectsParams, setSubjectsParams] = useState<{nome: string, questoes: number, peso: number, tempoManual?: number}[]>([]);'
);

// Update handleEditalSelect
content = content.replace(
  'setSubjectsParams(uniqueMaterias.map(m => ({ nome: m, questoes: 10, peso: 1 })));',
  'setSubjectsParams(uniqueMaterias.map(m => ({ nome: m, questoes: 10, peso: 1, tempoManual: 0 })));'
);

// Update handleUpdateSubjectParam to allow 'tempoManual'
content = content.replace(
  "const handleUpdateSubjectParam = (index: number, field: 'questoes' | 'peso', value: number) => {",
  "const handleUpdateSubjectParam = (index: number, field: 'questoes' | 'peso' | 'tempoManual', value: number) => {"
);

// Update handleAddSubjectParam
content = content.replace(
  'setSubjectsParams(prev => [...prev, { nome: "Nova Matéria", questoes: 10, peso: 1 }]);',
  'setSubjectsParams(prev => [...prev, { nome: "Nova Matéria", questoes: 10, peso: 1, tempoManual: 0 }]);'
);

// Update handleAddManualCycle mapping
content = content.replace(
  'materiaNome: s.nome,\n        duracao: 60,',
  'materiaNome: s.nome,\n        duracao: s.tempoManual || 60,'
);

fs.writeFileSync('src/components/StudyCycles.tsx', content);
console.log('Patched subjects state');
