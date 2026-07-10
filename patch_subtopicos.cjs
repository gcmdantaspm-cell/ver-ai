const fs = require('fs');
let content = fs.readFileSync('src/components/EditalView.tsx', 'utf-8');

content = content.replace(
  't?.subtopicos.find',
  '(t?.subtopicos || []).find'
);

fs.writeFileSync('src/components/EditalView.tsx', content);

let content2 = fs.readFileSync('src/store.tsx', 'utf-8');

content2 = content2.replace(
  't?.subtopicos.find',
  '(t?.subtopicos || []).find'
);

fs.writeFileSync('src/store.tsx', content2);
console.log('Patched');
