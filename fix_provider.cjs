const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf-8');
content = content.replace(
  'reorderMaterias, reorderTopicos, reorderSubtopicos',
  'reorderMaterias, reorderTopicos, reorderSubtopicos, discursivas, addDiscursiva, updateDiscursiva, deleteDiscursiva, toggleDiscursiva'
);
fs.writeFileSync('src/store.tsx', content);
