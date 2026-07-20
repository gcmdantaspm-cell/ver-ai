const fs = require('fs');
let content = fs.readFileSync('src/components/StudyCycles.tsx', 'utf-8');

content = content.replaceAll('{ setEditingCycleId(ciclo.id); setEditValue(ciclo.nome); }', '{ setEditingCycleId(ciclo.id); setEditValue(ciclo.nome); setEditCycleTarget(ciclo.targetMinutes || 0); }');

fs.writeFileSync('src/components/StudyCycles.tsx', content);
