const fs = require('fs');
let content = fs.readFileSync('src/components/StudyCycles.tsx', 'utf-8');

// Add editCycleTarget state
content = content.replace('const [editDuration, setEditDuration] = useState<number>(0);', 'const [editDuration, setEditDuration] = useState<number>(0);\n  const [editCycleTarget, setEditCycleTarget] = useState<number>(0);');

// Update saveCycleTitle
content = content.replace('const saveCycleTitle = (cicloId: string) => {\n    const ciclo = ciclos.find(c => c.id === cicloId);\n    if (ciclo && editValue.trim()) {\n      updateCiclo({ ...ciclo, nome: editValue.trim() });\n    }\n    setEditingCycleId(null);\n  };', 'const saveCycleTitle = (cicloId: string) => {\n    const ciclo = ciclos.find(c => c.id === cicloId);\n    if (ciclo && editValue.trim()) {\n      updateCiclo({ ...ciclo, nome: editValue.trim(), targetMinutes: editCycleTarget > 0 ? editCycleTarget : undefined });\n    }\n    setEditingCycleId(null);\n  };');

fs.writeFileSync('src/components/StudyCycles.tsx', content);
