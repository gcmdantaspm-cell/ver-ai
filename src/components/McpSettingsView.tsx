import { useState, useEffect } from "react";
import {
  Server,
  Check,
  Copy,
  Terminal,
  Zap,
  Globe,
  HelpCircle,
  Play,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from "lucide-react";

export function McpSettingsView() {
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingMethod, setTestingMethod] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const primaryMcpUrl = `${origin}/mcp`;
  const sseMcpUrl = `${origin}/mcp/sse`;
  const apiMcpUrl = `${origin}/api/mcp`;

  useEffect(() => {
    checkMcpHealth();
  }, []);

  const checkMcpHealth = async () => {
    setStatus("checking");
    try {
      const res = await fetch("/mcp");
      if (res.ok) {
        setStatus("online");
      } else {
        setStatus("offline");
      }
    } catch {
      setStatus("offline");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2500);
  };

  const runMcpTest = async (method: string, params: any = {}) => {
    setTestingMethod(method);
    setTestResult(null);
    try {
      const res = await fetch("/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method,
          params
        })
      });
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestResult(JSON.stringify({ error: err.message || "Erro ao conectar ao endpoint MCP" }, null, 2));
    } finally {
      setTestingMethod(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-900 text-white rounded-xl shadow-md shadow-blue-900/20">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                  Servidor MCP (Model Context Protocol)
                </h1>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                  Conecte o Verticaliza IA ao Google Gemini, Claude, Cursor ou ChatGPT
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <span
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                status === "online"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : status === "checking"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  status === "online"
                    ? "bg-emerald-500 animate-pulse"
                    : status === "checking"
                    ? "bg-amber-500 animate-ping"
                    : "bg-rose-500"
                }`}
              ></span>
              {status === "online"
                ? "Servidor MCP Online"
                : status === "checking"
                ? "Verificando..."
                : "Servidor Offline"}
            </span>

            <button
              onClick={checkMcpHealth}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Recarregar
            </button>
          </div>
        </div>

        {/* Primary MCP URL Card */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Link para Conectar com o Gemini / Aplicativo Personalizado
          </div>

          <h2 className="text-lg md:text-xl font-bold mb-4 text-white">
            URL Principal do Servidor MCP
          </h2>

          <div className="bg-slate-900/80 backdrop-blur-md p-3.5 md:p-4 rounded-xl border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="font-mono text-sm md:text-base text-blue-200 truncate select-all px-1">
              {primaryMcpUrl}
            </div>
            <button
              onClick={() => copyToClipboard(primaryMcpUrl, "primary")}
              className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs rounded-lg transition-all shadow-md active:scale-95"
            >
              {copied === "primary" ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar URL do MCP
                </>
              )}
            </button>
          </div>

          {/* Alternative URLs */}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs text-blue-200">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Endpoint SSE:</span>
              <code className="bg-black/30 px-2 py-0.5 rounded text-white font-mono">{sseMcpUrl}</code>
              <button
                onClick={() => copyToClipboard(sseMcpUrl, "sse")}
                className="text-amber-300 hover:underline"
              >
                {copied === "sse" ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Endpoint API:</span>
              <code className="bg-black/30 px-2 py-0.5 rounded text-white font-mono">{apiMcpUrl}</code>
              <button
                onClick={() => copyToClipboard(apiMcpUrl, "api")}
                className="text-amber-300 hover:underline"
              >
                {copied === "api" ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        </div>

        {/* How to configure in Gemini Guide */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <HelpCircle className="w-5 h-5 text-blue-900" />
            Como configurar no Google Gemini / Aplicativo Conectado
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="w-7 h-7 bg-blue-900 text-white rounded-lg flex items-center justify-center font-bold text-xs mb-3">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Copiar o Link</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clique no botão de copiar acima para guardar a URL do servidor MCP:
                <code className="block mt-1 font-mono text-[11px] bg-slate-200/70 p-1 rounded text-slate-800">
                  {primaryMcpUrl}
                </code>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="w-7 h-7 bg-blue-900 text-white rounded-lg flex items-center justify-center font-bold text-xs mb-3">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Colar no Gemini</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                No Gemini, vá em <strong className="text-slate-700">Configurações &gt; Aplicativos Conectados</strong> e selecione <strong className="text-slate-700">Adicionar um aplicativo personalizado</strong>. Cole a URL no campo.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs mb-3">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Aviso sobre Vercel</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Se for usar seu próprio domínio (como Vercel), lembre-se de <strong>fazer um novo deploy (commit)</strong> com as pastas <code className="bg-slate-200 p-0.5 rounded">/api</code> criadas para suportar o servidor!
              </p>
            </div>
          </div>
        </div>

        {/* Exposed Tools List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
              <Zap className="w-5 h-5 text-amber-500" />
              Ferramentas Disponíveis no Servidor MCP (Tools)
            </div>
            <span className="text-xs font-semibold text-slate-400">9 Ferramentas MCP Ativas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                name: "list_editais",
                desc: "Lista todos os editais verticalizados cadastrados e seu progresso."
              },
              {
                name: "get_edital_details",
                desc: "Detalhes de tópicos, subtópicos, revisões e acertos/erros de um edital."
              },
              {
                name: "search_edital_topics",
                desc: "Pesquisa por termos, matérias, leis ou artigos nos editais."
              },
              {
                name: "get_revisions_queue",
                desc: "Consulta a fila de revisões (agendadas, atrasadas e do dia)."
              },
              {
                name: "list_study_cycles",
                desc: "Lista ciclos de estudo, matérias e minutos de cronograma."
              },
              {
                name: "get_study_summary",
                desc: "Estatísticas globais de estudo, taxa de acerto e progresso."
              },
              {
                name: "list_discursivas",
                desc: "Lista provas discursivas e temas de redação cadastrados."
              },
              {
                name: "complete_revision",
                desc: "Conclui uma revisão diretamente solicitando à IA."
              },
              {
                name: "generate_study_recommendation",
                desc: "Gera recomendações e planejamento do que estudar a seguir."
              }
            ].map((tool, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-start gap-3 transition-colors"
              >
                <div className="p-1.5 bg-blue-100 text-blue-900 rounded-lg shrink-0 mt-0.5">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <div>
                  <code className="text-xs font-bold text-blue-900 font-mono">{tool.name}</code>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{tool.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive MCP Tester */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
              <Terminal className="w-5 h-5 text-indigo-600" />
              Testador de Protocolo MCP (Live Playground)
            </div>
            <span className="text-xs text-slate-400">Teste as chamadas JSON-RPC ao vivo</span>
          </div>

          <p className="text-xs text-slate-500">
            Simule requisições que o Google Gemini e assistentes de IA enviam para testar a resposta do seu servidor MCP em tempo real:
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => runMcpTest("initialize", { protocolVersion: "2024-11-05" })}
              disabled={!!testingMethod}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-200"
            >
              {testingMethod === "initialize" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Testar: initialize
            </button>

            <button
              onClick={() => runMcpTest("tools/list")}
              disabled={!!testingMethod}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              {testingMethod === "tools/list" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Testar: tools/list
            </button>

            <button
              onClick={() =>
                runMcpTest("tools/call", {
                  name: "get_study_summary",
                  arguments: {}
                })
              }
              disabled={!!testingMethod}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-200"
            >
              {testingMethod === "tools/call:get_study_summary" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Testar: get_study_summary
            </button>

            <button
              onClick={() =>
                runMcpTest("tools/call", {
                  name: "search_edital_topics",
                  arguments: { query: "Licitações" }
                })
              }
              disabled={!!testingMethod}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-200"
            >
              {testingMethod === "tools/call:search" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Testar: busca ("Licitações")
            </button>
          </div>

          {testResult && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Resposta do Servidor (JSON-RPC):</span>
                <button
                  onClick={() => setTestResult(null)}
                  className="text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  Limpar
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-80 border border-slate-800 shadow-inner">
                {testResult}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
