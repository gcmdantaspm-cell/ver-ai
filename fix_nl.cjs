const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// The file currently has literal characters backslash and 'n', which means string "\n".
// Wait, no, maybe it has literally the letters 'n' without backslash?
// Let's print out what is actually in the file using char codes.
const match = content.match(/res\.write\(.*endpoint.*/);
console.log(match[0]);
for (let i = 0; i < match[0].length; i++) {
  console.log(match[0][i], match[0].charCodeAt(i));
}
