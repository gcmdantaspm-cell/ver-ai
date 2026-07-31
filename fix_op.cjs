const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf8');

content = content.replace(/'ADD'/g, 'OperationType.CREATE');
content = content.replace(/'UPDATE'/g, 'OperationType.UPDATE');
content = content.replace(/'DELETE'/g, 'OperationType.DELETE');
content = content.replace(/'READ'/g, 'OperationType.GET');

fs.writeFileSync('src/store.tsx', content);
