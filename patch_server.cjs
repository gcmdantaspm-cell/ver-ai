const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const oldGetHandler = `  // GET handler for MCP (Supports SSE transport & direct health check verification)
  app.get(pathUri, (req: Request, res: Response) => {
    const acceptHeader = req.headers.accept || "";

    // Check if SSE transport requested
    if (acceptHeader.includes("text/event-stream") || req.query.transport === "sse") {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const sessionId = (req.query.sessionId as string) || crypto.randomUUID();
      const endpointUri = \`/api/mcp/messages?sessionId=\${sessionId}\`;

      // Emit required MCP SSE endpoint event
      res.write(\`event: endpoint\\ndata: \${endpointUri}\\n\\n\`);

      // Keep connection alive with periodic pings
      const keepAlive = setInterval(() => {
        res.write(\`: keep-alive\\n\\n\`);
      }, 15000);

      req.on("close", () => {
        clearInterval(keepAlive);
      });
      return;
    }`;

const newGetHandler = `  // GET handler for MCP (Supports SSE transport & direct health check verification)
  app.get(pathUri, (req: Request, res: Response) => {
    const acceptHeader = req.headers.accept || "";

    // Check if SSE transport requested or explicitly hitting an /sse route
    if (pathUri.endsWith("/sse") || acceptHeader.includes("text/event-stream") || req.query.transport === "sse") {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const sessionId = (req.query.sessionId as string) || crypto.randomUUID();
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers.host;
      // Provide an absolute URL to the messages endpoint, as required by some strict MCP clients
      const messagesPath = pathUri.replace('/sse', '/messages');
      const baseUri = messagesPath.includes('/messages') ? messagesPath : '/mcp/messages';
      const endpointUri = \`\${protocol}://\${host}\${baseUri}?sessionId=\${sessionId}\`;

      // Emit required MCP SSE endpoint event
      res.write(\`event: endpoint\\ndata: \${endpointUri}\\n\\n\`);

      // Keep connection alive with periodic pings
      const keepAlive = setInterval(() => {
        res.write(\`: keep-alive\\n\\n\`);
      }, 10000);

      req.on("close", () => {
        clearInterval(keepAlive);
      });
      return;
    }`;

content = content.replace(oldGetHandler, newGetHandler);
fs.writeFileSync('server.ts', content);
console.log("Patched server.ts GET handler");
