const fs = require('fs');
let lines = fs.readFileSync('src/components/EditalView.tsx', 'utf8').split('\n');
lines.splice(377, 86); // 377 is index for line 378. 463 - 378 + 1 = 86
fs.writeFileSync('src/components/EditalView.tsx', lines.join('\n'));
console.log('Deleted 86 lines');
