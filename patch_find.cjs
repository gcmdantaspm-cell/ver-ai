const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf-8');

const oldFind = `                if (topico.id === itemId) return true;
                if (topico?.subtopicos.some(s => s.id === itemId)) return true;`;

const newFind = `                if (topico.id === itemId) return true;
                if (topico?.subtopicos.some(s => s.id === itemId)) return true;
                if (topico?.subtopicos.some(s => s.subitens?.some(sub => sub.id === itemId))) return true;`;

content = content.replace(oldFind, newFind);
fs.writeFileSync('src/store.tsx', content);
console.log("Patched target search");
