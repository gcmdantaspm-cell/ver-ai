const fs = require('fs');
let content = fs.readFileSync('src/components/DiscursivasView.tsx', 'utf-8');
content = content.replace('style={{ width: \\`\\${total > 0 ? (concluídas / total) * 100 : 0}%\\` }}', 'style={{ width: `${total > 0 ? (concluídas / total) * 100 : 0}%` }}');
fs.writeFileSync('src/components/DiscursivasView.tsx', content);
