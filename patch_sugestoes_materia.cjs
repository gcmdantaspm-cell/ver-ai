const fs = require('fs');

let content = fs.readFileSync('src/components/RevisaoSugestoes.tsx', 'utf-8');

content = content.replace(/Record<string, \{ materiaNome: string, editalTitulo: string, itens: Sugestao\[\] \}>/, 'Record<string, { materiaId: string, materiaNome: string, editalTitulo: string, itens: Sugestao[] }>');
content = content.replace(/acc\[curr.materiaId\] = \{ materiaNome: curr.materiaNome, editalTitulo: curr.editalTitulo, itens: \[\] \};/, 'acc[curr.materiaId] = { materiaId: curr.materiaId, materiaNome: curr.materiaNome, editalTitulo: curr.editalTitulo, itens: [] };');

fs.writeFileSync('src/components/RevisaoSugestoes.tsx', content);
console.log('Fixed materiaId issue');
