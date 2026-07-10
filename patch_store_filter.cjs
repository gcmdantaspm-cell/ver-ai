const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf-8');

content = content.replace(
  'if(m) m.topicos = m.topicos.filter(t => t.id !== targetId);',
  'if(m) m.topicos = (m.topicos || []).filter(t => t.id !== targetId);'
);
content = content.replace(
  'if(t) t.subtopicos = t.subtopicos.filter(s => s.id !== targetId);',
  'if(t) t.subtopicos = (t.subtopicos || []).filter(s => s.id !== targetId);'
);

fs.writeFileSync('src/store.tsx', content);
console.log('Patched');
