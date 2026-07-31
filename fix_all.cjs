const fs = require('fs');

const code = fs.readFileSync('server.ts', 'utf8');

const regex = /mcpPaths\.forEach[\s\S]*\}\);\n\n\/\/ Extra Healthcheck Endpoint/;

const replacement = `mcpPaths.forEach((pathUri) => {
  // GET handler for MCP (Supports SSE transport & direct health check verification)
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
      
      const messagesPath = pathUri.replace('/sse', '/messages');
      const baseUri = messagesPath.includes('/messages') ? messagesPath : '/mcp/messages';
      const endpointUri = \`\${protocol}://\${host}\${baseUri}?sessionId=\${sessionId}\`;

      res.write(\`event: endpoint\\ndata: \${endpointUri}\\n\\n\`);

      const keepAlive = setInterval(() => {
        res.write(\`: keep-alive\\n\\n\`);
      }, 10000);

      req.on("close", () => {
        clearInterval(keepAlive);
      });
      return;
    }

    res.json({
      jsonrpc: "2.0",
      result: {
        status: "active",
        service: "Verticaliza IA MCP Server",
        version: "1.0.0",
        protocolVersion: "2024-11-05",
        description: "Servidor MCP",
        mcpEndpoint: "/mcp",
        capabilities: {
          tools: true,
          prompts: true,
          resources: true
        }
      }
    });
  });

  app.post(pathUri, (req: Request, res: Response) => {
    handleMCPJsonRpcRequest(req.body, res);
  });
});

// Extra Healthcheck Endpoint`;

const newCode = code.replace(regex, replacement);
fs.writeFileSync('server.ts', newCode);
console.log("Fixed via regex replace");
