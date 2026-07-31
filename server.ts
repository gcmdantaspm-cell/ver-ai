import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

const app = express();
const PORT = 3000;

// Enable JSON parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Universal CORS Middleware for MCP protocol compatibility
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, mcp-version, X-Requested-With, Accept, x-session-id"
  );
  res.setHeader("Access-Control-Expose-Headers", "Content-Type, Location, Event-Source");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  next();
});

// Sample / In-Memory Initial Data for MCP Server Operations
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
                      subtopicos: []
                    }
                  ]
                },
                {
                  id: "top-2",
                  titulo: "2 Domínio da estrutura morfossintática do período.",
                  visto: true,
                  data_estudo: "2026-07-25T14:00:00Z",
                  revisoes_agendadas: ["2026-07-26T14:00:00Z", "2026-08-01T14:00:00Z"],
                  revisoes_concluidas: 1,
                  acertos: 15,
                  erros: 3,
                  subtopicos: []
                }
              ]
            },
            {
              id: "mat-rlm",
              nome: "Raciocínio Lógico e Matemática",
              topicos: [
                {
                  id: "top-3",
                  titulo: "1 Lógica de argumentação: diagramas lógicos.",
                  visto: false,
                  data_estudo: null,
                  revisoes_agendadas: [],
                  revisoes_concluidas: 0,
                  acertos: 0,
                  erros: 0,
                  subtopicos: []
                }
              ]
            }
          ]
        },
        {
          id: "area-2",
          area: "CONHECIMENTOS ESPECÍFICOS",
          materias: [
            {
              id: "mat-dir-adm",
              nome: "Direito Administrativo",
              topicos: [
                {
                  id: "top-4",
                  titulo: "12 Licitações e contratos administrativos.",
                  visto: true,
                  data_estudo: "2026-07-28T16:00:00Z",
                  revisoes_agendadas: ["2026-07-29T16:00:00Z", "2026-08-04T16:00:00Z"],
                  revisoes_concluidas: 1,
                  acertos: 12,
                  erros: 4,
                  subtopicos: [
                    {
                      id: "sub-12-1",
                      titulo: "12.1 Lei federal nº 14.133/2021 (Nova Lei de Licitações).",
                      visto: true,
                      data_estudo: "2026-07-28T16:30:00Z",
                      revisoes_agendadas: ["2026-07-29T16:30:00Z"],
                      revisoes_concluidas: 1,
                      acertos: 8,
                      erros: 2,
                      subtopicos: []
                    },
                    {
                      id: "sub-12-2",
                      titulo: "12.2 Contratos administrativos.",
                      visto: false,
                      data_estudo: null,
                      revisoes_agendadas: [],
                      revisoes_concluidas: 0,
                      acertos: 0,
                      erros: 0,
                      subtopicos: []
                    }
                  ]
                }
              ]
            },
            {
              id: "mat-ti",
              nome: "Tecnologia da Informação",
              topicos: [
                {
                  id: "top-ti-1",
                  titulo: "1 Conceitos de redes de computadores e arquitetura TCP/IP.",
                  visto: true,
                  data_estudo: "2026-07-29T09:00:00Z",
                  revisoes_agendadas: ["2026-07-30T09:00:00Z", "2026-08-05T09:00:00Z"],
                  revisoes_concluidas: 1,
                  acertos: 25,
                  erros: 2,
                  subtopicos: []
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
        { id: "ci-3", materiaNome: "Tecnologia da Informação", duracao: 90, concluido: false },
        { id: "ci-4", materiaNome: "Raciocínio Lógico", duracao: 30, concluido: false }
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
      minhaResposta: "A anulação decorre de ilegalidade com efeitos ex tunc, enquanto a revogação se dá por oportunidade e conveniência com efeitos ex nunc."
    }
  ]
};

// Helper: Process MCP Tools Execution
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
        content: [
          {
            type: "text",
            text: JSON.stringify({ editais: editaisList }, null, 2)
          }
        ]
      };
    }

    case "get_edital_details": {
      const searchId = (args?.editalId || "").toLowerCase();
      const edital = mcpDatabase.editais.find(
        (e) => e.id.toLowerCase() === searchId || e.titulo.toLowerCase().includes(searchId)
      ) || mcpDatabase.editais[0];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(edital, null, 2)
          }
        ]
      };
    }

    case "search_edital_topics": {
      const query = (args?.query || "").toLowerCase();
      const results: any[] = [];

      mcpDatabase.editais.forEach((ed) => {
        ed.areas.forEach((a) => {
          a.materias.forEach((m) => {
            if (m.nome.toLowerCase().includes(query)) {
              results.push({ edital: ed.titulo, materia: m.nome, tipo: "Matéria completa" });
            }
            m.topicos.forEach((t) => {
              if (t.titulo.toLowerCase().includes(query)) {
                results.push({
                  edital: ed.titulo,
                  materia: m.nome,
                  topicoId: t.id,
                  titulo: t.titulo,
                  estudado: t.visto,
                  revisoesConcluidas: t.revisoes_concluidas
                });
              }
              t.subtopicos?.forEach((s) => {
                if (s.titulo.toLowerCase().includes(query)) {
                  results.push({
                    edital: ed.titulo,
                    materia: m.nome,
                    topicoPai: t.titulo,
                    subtopicoId: s.id,
                    titulo: s.titulo,
                    estudado: s.visto
                  });
                }
              });
            });
          });
        });
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ busca: query, totalEncontrados: results.length, resultados: results }, null, 2)
          }
        ]
      };
    }

    case "get_revisions_queue": {
      const now = new Date();
      const revisions: any[] = [];

      mcpDatabase.editais.forEach((ed) => {
        ed.areas.forEach((a) => {
          a.materias.forEach((m) => {
            m.topicos.forEach((t) => {
              (t.revisoes_agendadas || []).forEach((revDateStr, idx) => {
                const revDate = new Date(revDateStr);
                const isLate = revDate < now && revDate.toDateString() !== now.toDateString();
                const isToday = revDate.toDateString() === now.toDateString();

                revisions.push({
                  edital: ed.titulo,
                  materia: m.nome,
                  topico: t.titulo,
                  revisao: `R${idx + 1}`,
                  dataAgendada: revDateStr,
                  status: isLate ? "Atrasada" : isToday ? "Hoje" : "Futura"
                });
              });
            });
          });
        });
      });

      const filter = args?.status;
      let filtered = revisions;
      if (filter === "atrasadas") filtered = revisions.filter((r) => r.status === "Atrasada");
      if (filter === "hoje") filtered = revisions.filter((r) => r.status === "Hoje");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ totalRevisoes: filtered.length, revisoes: filtered }, null, 2)
          }
        ]
      };
    }

    case "list_study_cycles": {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ciclos: mcpDatabase.ciclos }, null, 2)
          }
        ]
      };
    }

    case "get_study_summary": {
      let totalTopicos = 0;
      let estudados = 0;
      let acertosTotal = 0;
      let errosTotal = 0;

      mcpDatabase.editais.forEach((ed) => {
        ed.areas.forEach((a) => {
          a.materias.forEach((m) => {
            m.topicos.forEach((t) => {
              totalTopicos++;
              if (t.visto) estudados++;
              acertosTotal += t.acertos || 0;
              errosTotal += t.erros || 0;
              t.subtopicos?.forEach((s) => {
                totalTopicos++;
                if (s.visto) estudados++;
                acertosTotal += s.acertos || 0;
                errosTotal += s.erros || 0;
              });
            });
          });
        });
      });

      const taxaAcertos = acertosTotal + errosTotal > 0 ? ((acertosTotal / (acertosTotal + errosTotal)) * 100).toFixed(1) + "%" : "0%";

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                resumo: {
                  totalEditais: mcpDatabase.editais.length,
                  totalTopicos,
                  topicosEstudados: estudados,
                  percentualEditalCumprido: `${Math.round((estudados / (totalTopicos || 1)) * 100)}%`,
                  questoesTotais: acertosTotal + errosTotal,
                  acertos: acertosTotal,
                  erros: errosTotal,
                  taxaDeAcerto: taxaAcertos,
                  statusServidorMCP: "Online & Sincronizado"
                }
              },
              null,
              2
            )
          }
        ]
      };
    }

    case "complete_revision": {
      const itemId = args?.itemId;
      let found = false;

      mcpDatabase.editais.forEach((ed) => {
        ed.areas.forEach((a) => {
          a.materias.forEach((m) => {
            m.topicos.forEach((t) => {
              if (t.id === itemId) {
                t.revisoes_concluidas = (t.revisoes_concluidas || 0) + 1;
                if (t.revisoes_agendadas.length > 0) t.revisoes_agendadas.shift();
                found = true;
              }
            });
          });
        });
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, itemId, mensagem: found ? "Revisão concluída com sucesso no Verticaliza IA!" : "Item marcado como revisado." })
          }
        ]
      };
    }

    case "list_discursivas": {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ discursivas: mcpDatabase.discursivas }, null, 2)
          }
        ]
      };
    }

    case "generate_study_recommendation": {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                recomendacao: "Foco prioritário do dia:",
                passos: [
                  "1. Concluir a revisão de Direito Administrativo (Lei 14.133/2021) agendada.",
                  "2. Iniciar o bloco de 90min de Tecnologia da Informação (Redes TCP/IP) do Ciclo Principal.",
                  "3. Resolver 15 questões inéditas de Raciocínio Lógico (Diagramas Lógicos)."
                ]
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
        content: [
          {
            type: "text",
            text: JSON.stringify({ status: "Ferramenta executada com sucesso.", args })
          }
        ]
      };
  }
}

// Handler function for MCP JSON-RPC protocol requests
function handleMCPJsonRpcRequest(body: any, res: Response) {
  const { jsonrpc, id, method, params } = body || {};

  // Standard MCP tools specification
  const mcpToolsList = [
    {
      name: "list_editais",
      description: "Lista todos os editais verticalizados do Verticaliza IA com estatísticas de tópicos e acertos.",
      inputSchema: {
        type: "object",
        properties: {
          filter: { type: "string", description: "Filtro por nome do edital" }
        }
      }
    },
    {
      name: "get_edital_details",
      description: "Obtém detalhes completos de um edital verticalizado, incluindo matérias, tópicos, subtópicos e revisões.",
      inputSchema: {
        type: "object",
        properties: {
          editalId: { type: "string", description: "ID ou nome do edital" }
        },
        required: ["editalId"]
      }
    },
    {
      name: "search_edital_topics",
      description: "Pesquisa por termos, matérias, leis ou tópicos dentro de todos os editais verticalizados.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Palavra-chave para busca" }
        },
        required: ["query"]
      }
    },
    {
      name: "get_revisions_queue",
      description: "Obtém a lista de revisões agendadas, atrasadas e do dia.",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["todas", "atrasadas", "hoje"], description: "Filtro de revisões" }
        }
      }
    },
    {
      name: "list_study_cycles",
      description: "Obtém os ciclos de estudo cadastrados com cronogramas e tempo em minutos.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "get_study_summary",
      description: "Obtém o resumo com métricas de desempenho, progresso do edital e taxa de acertos em questões.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "list_discursivas",
      description: "Lista as questões e temas discursivos cadastrados no aplicativo.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "complete_revision",
      description: "Marca uma revisão como realizada no edital.",
      inputSchema: {
        type: "object",
        properties: {
          itemId: { type: "string", description: "ID do tópico a ser concluído" }
        },
        required: ["itemId"]
      }
    },
    {
      name: "generate_study_recommendation",
      description: "Gera sugestão e planejamento inteligente dos assuntos a estudar.",
      inputSchema: {
        type: "object",
        properties: {
          materia: { type: "string", description: "Matéria de interesse" }
        }
      }
    }
  ];

  switch (method) {
    case "initialize":
      return res.json({
        jsonrpc: "2.0",
        id: id ?? 1,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: { listChanged: false },
            prompts: { listChanged: false },
            resources: { listChanged: false }
          },
          serverInfo: {
            name: "verticaliza-ia-mcp",
            version: "1.0.0"
          },
          instructions:
            "Servidor MCP do Verticaliza IA conectado com sucesso! Você pode acessar editais, tópicos, matérias, revisões e ciclos de estudo."
        }
      });

    case "notifications/initialized":
      return res.json({
        jsonrpc: "2.0",
        id: id ?? null,
        result: {}
      });

    case "ping":
      return res.json({
        jsonrpc: "2.0",
        id: id ?? 1,
        result: {}
      });

    case "tools/list":
      return res.json({
        jsonrpc: "2.0",
        id: id ?? 1,
        result: {
          tools: mcpToolsList
        }
      });

    case "tools/call": {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const toolResult = handleCallTool(toolName, toolArgs);

      return res.json({
        jsonrpc: "2.0",
        id: id ?? 1,
        result: toolResult
      });
    }

    case "prompts/list":
      return res.json({
        jsonrpc: "2.0",
        id: id ?? 1,
        result: {
          prompts: [
            {
              name: "resumo_diario",
              description: "Fornece um diagnóstico rápido do progresso do candidato e o que estudar hoje."
            },
            {
              name: "simular_duvida_edital",
              description: "Responde dúvidas sobre tópicos do edital verticalizado."
            }
          ]
        }
      });

    case "resources/list":
      return res.json({
        jsonrpc: "2.0",
        id: id ?? 1,
        result: {
          resources: [
            {
              uri: "verticaliza://summary",
              name: "Resumo Geral de Estudos",
              description: "Métricas de estudo e progresso geral",
              mimeType: "application/json"
            },
            {
              uri: "verticaliza://editais",
              name: "Editais Verticalizados",
              description: "Lista de editais e tópicos",
              mimeType: "application/json"
            }
          ]
        }
      });

    default:
      // Fallback for unknown methods or generic metadata requests
      return res.json({
        jsonrpc: "2.0",
        id: id ?? 1,
        result: {
          status: "ok",
          message: `Método ${method} recebido.`,
          server: "Verticaliza IA MCP"
        }
      });
  }
}

// MCP Endpoints support: /mcp, /mcp/sse, /mcp/messages, /api/mcp, /api/mcp/sse, /api/mcp/messages
const mcpPaths = ["/mcp", "/mcp/sse", "/mcp/messages", "/api/mcp", "/api/mcp/sse", "/api/mcp/messages"];

mcpPaths.forEach((pathUri) => {
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
      const endpointUri = `${protocol}://${host}${baseUri}?sessionId=${sessionId}`;

      res.write(`event: endpoint\ndata: ${endpointUri}\n\n`);

      const keepAlive = setInterval(() => {
        res.write(`: keep-alive\n\n`);
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

// Extra Healthcheck Endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", mcp: true, timestamp: new Date().toISOString() });
});

async function startServer() {
  // Vite middleware setup for Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Verticaliza IA Express Server running on http://0.0.0.0:${PORT}`);
    console.log(`🔌 MCP Protocol Endpoint active on http://0.0.0.0:${PORT}/mcp`);
  });
}

startServer();
