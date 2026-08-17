export const config = {
  runtime: 'edge',
};

export default function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Expose-Headers': '*',
      }
    });
  }

  const acceptHeader = request.headers.get('accept') || '';
  const url = new URL(request.url);

  // If not explicitly requesting SSE, and not explicitly hitting an /sse path, return a JSON healthcheck
  if (!acceptHeader.includes('text/event-stream') && request.method === 'GET' && !url.searchParams.has('transport')) {
    // Return standard healthcheck json
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      result: {
        status: "active",
        service: "Verticaliza IA MCP Server (Vercel Edge)",
        version: "1.0.0",
        protocolVersion: "2024-11-05",
        description: "Servidor MCP na Vercel",
        mcpEndpoint: "/api/mcp/sse",
        capabilities: {
          tools: true,
          prompts: true,
          resources: true
        }
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Ensure we use the proper origin (Vercel domain)
  let endpoint = `${url.origin}/api/mcp/messages`;
  
  const sessionId = crypto.randomUUID();
  endpoint += `?sessionId=${sessionId}`;

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: endpoint\ndata: ${endpoint}\n\n`));
      
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`: keep-alive\n\n`));
      }, 10000);
      
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
