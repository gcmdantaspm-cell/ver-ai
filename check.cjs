const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf8');
const match = code.match(/event: endpoint.*/);
console.log(match[0]);
