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

  const url = new URL(request.url);
  // Ensure we use the proper origin (Vercel domain)
  let endpoint = `${url.origin}/api/mcp/messages`;
  // Fallback if URL somehow lacks origin context, though Vercel Edge Request always has it
  
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
