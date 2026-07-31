export const config = {
  runtime: 'edge',
};

// Simplified Mock Database for Vercel Edge 
const mcpDatabase = {
  editais: [
    {
      id: "edital-pf-2026",
      titulo: "Polícia Federal - Agente de Polícia",
      areas: [
        {
          id: "area-1",
          area: "CONHECIMENTOS BÁSICOS",
          materias: [
            {
              id: "mat-port",
              nome: "Língua Portuguesa",
              topicos: [
                {
                  id: "top-1",
                  titulo: "1 Compreensão e interpretação de textos de gêneros variados.",
                  visto: true,
                  data_estudo: "2026-07-20T10:00:00Z",
                  revisoes_agendadas: ["2026-07-21T10:00:00Z", "2026-07-27T10:00:00Z", "2026-08-04T10:00:00Z"],
                  revisoes_concluidas: 2,
                  acertos: 18,
                  erros: 2,
                  subtopicos: [
                    {
                      id: "sub-1-1",
                      titulo: "1.1 Reconhecimento de tipos e gêneros textuais.",
                      visto: true,
                      data_estudo: "2026-07-20T10:30:00Z",
                      revisoes_agendadas: ["2026-07-21T10:30:00Z"],
                      revisoes_concluidas: 1,
                      acertos: 10,
                      erros: 1,
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  ciclos: [
    {
      id: "ciclo-1",
      nome: "Ciclo Principal de Estudos - PF",
      targetMinutes: 240,
      items: [
        { id: "ci-1", materiaNome: "Língua Portuguesa", duracao: 60, concluido: true },
        { id: "ci-2", materiaNome: "Direito Administrativo", duracao: 60, concluido: true },
      ]
    }
  ],
  discursivas: [
    {
      id: "disc-1",
      topico: "Atos Administrativos e Anulação vs Revogação",
      concluido: true,
      pontuacaoMaxima: 20,
      pontuacaoObtida: 18.5,
      comandoQuestao: "Discorra sobre as diferenças fundamentais entre anulação e revogação dos atos administrativos.",
    }
  ]
};

function handleCallTool(name: string, args: any) {
  switch (name) {
    case "list_editais": {
      const editaisList = mcpDatabase.editais.map((ed) => {
        let totalTopicos = 0;
        let concluidos = 0;
        let acertos = 0;
        let erros = 0;

        ed.areas.forEach((a) => {
          a.materias.forEach((m) => {
            m.topicos.forEach((t) => {
              totalTopicos++;
              if (t.visto) concluidos++;
              acertos += t.acertos || 0;
              erros += t.erros || 0;
              t.subtopicos?.forEach((s) => {
                totalTopicos++;
                if (s.visto) concluidos++;
                acertos += s.acertos || 0;
                erros += s.erros || 0;
              });
            });
          });
        });

        const percentual = totalTopicos > 0 ? Math.round((concluidos / totalTopicos) * 100) : 0;
        return {
          id: ed.id,
          titulo: ed.titulo,
          totalTopicos,
          concluidos,
          percentualProgresso: `${percentual}%`,
          materiasCount: ed.areas.reduce((acc, a) => acc + a.materias.length, 0),
          questoesRespondidas: acertos + erros,
          taxaAcerto: acertos + erros > 0 ? `${Math.round((acertos / (acertos + erros)) * 100)}%` : "0%"
        };
      });

      return {
        content: [{ type: "text", text: JSON.stringify({ editais: editaisList }, null, 2) }]
      };
    }
    case "get_edital_details": {
      return {
        content: [{ type: "text", text: JSON.stringify(mcpDatabase.editais[0], null, 2) }]
      };
    }
    case "get_study_summary": {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                resumo: {
                  totalEditais: 1,
                  totalTopicos: 2,
                  topicosEstudados: 2,
                  percentualEditalCumprido: "100%",
                  questoesTotais: 31,
                  acertos: 28,
                  erros: 3,
                  taxaDeAcerto: "90.3%",
                  statusServidorMCP: "Online & Sincronizado (Vercel Edge)"
                }
              },
              null,
              2
            )
          }
        ]
      };
    }
    default:
      return {
        content: [{ type: "text", text: JSON.stringify({ status: "Ferramenta executada.", args }) }]
      };
  }
}

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Expose-Headers': '*',
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  const mcpToolsList = [
    {
      name: "list_editais",
      description: "Lista editais verticalizados",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "get_edital_details",
      description: "Obtém detalhes do edital",
      inputSchema: { type: "object", properties: { editalId: { type: "string" } }, required: ["editalId"] }
    },
    {
      name: "get_study_summary",
      description: "Resumo de estudos",
      inputSchema: { type: "object", properties: {} }
    }
  ];

  try {
    const body = await request.json();
    const { jsonrpc, id, method, params } = body;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    };

    if (method === 'initialize') {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        id: id ?? 1,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "verticaliza-ia-edge", version: "1.0.0" },
        }
      }), { headers: corsHeaders });
    }

    if (method === 'tools/list') {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        id: id ?? 1,
        result: { tools: mcpToolsList }
      }), { headers: corsHeaders });
    }

    if (method === 'tools/call') {
      const toolResult = handleCallTool(params?.name, params?.arguments);
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        id: id ?? 1,
        result: toolResult
      }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      id: id ?? 1,
      result: { status: "ok" }
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid Request' }), { status: 400 });
  }
}
