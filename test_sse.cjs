const http = require('http');

http.get('http://localhost:3000/mcp/sse', (res) => {
  res.on('data', (chunk) => {
    console.log("CHUNK RECEIVED:");
    for (let i = 0; i < chunk.length; i++) {
      process.stdout.write(chunk[i] + ' ');
    }
    console.log("\nSTRING: " + chunk.toString('utf8'));
    process.exit(0);
  });
});
