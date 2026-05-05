import { useState } from "react";
import { parseEditalText } from "../services/ai";
import { useEdital } from "../store";
import { Loader2, PlusCircle, Sparkles, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export function ParseEdital({ onSuccess }: { onSuccess: () => void }) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addEdital } = useEdital();

  const handleParse = async () => {
    if (!text || !title) {
      setError("Por favor, preencha o título e o texto do edital.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const areas = await parseEditalText(text);
      addEdital({
        id: uuidv4(),
        titulo: title,
        areas: areas
      });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || String(err);
      if (errorMessage.includes("high demand") || errorMessage.includes("UNAVAILABLE") || err?.status === "UNAVAILABLE" || err?.status === 503) {
         setError("A Inteligência Artificial está enfrentando alta demanda no momento (sobrecarga nos servidores do Google). Por favor, aguarde alguns instantes e tente novamente.");
      } else {
         setError(`Falha ao processar o texto do edital. Ocorreu um erro na IA: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-800 selection:bg-blue-900/30">
        <header className="h-20 px-8 flex items-center justify-between shrink-0 border-b border-slate-200 bg-slate-50/50 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex flex-col">
            <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">Importação Inteligente</h2>
            <p className="text-[10px] text-blue-800 font-bold uppercase tracking-[0.2em] mt-1">IA-Powered verticalization</p>
          </div>
        </header>

      <div className="flex-1 px-8 pb-32 pt-10 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-rose-500/5 border border-rose-500/20 text-rose-400 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-wide flex items-center gap-3 mb-8 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-10 space-y-10">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">
                  Título do Plano de Estudo
                </label>
                <input
                  type="text"
                  className="w-full px-6 py-4 bg-white shadow-sm border border-slate-300 rounded-2xl focus:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900/40 transition-all text-sm font-bold text-slate-900 placeholder:text-slate-700"
                  placeholder="Ex: Concurso Magistratura 2024"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4 ml-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                    Conteúdo Programático Bruto
                  </label>
                  <span className="text-[9px] font-bold text-blue-800/50 uppercase tracking-widest bg-blue-900/5 px-2 py-0.5 rounded border border-blue-900/10">Processamento Natural</span>
                </div>
                <textarea
                  className="w-full h-[450px] px-6 py-5 bg-white shadow-sm border border-slate-300 rounded-2xl focus:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900/40 transition-all resize-none font-mono text-[13px] leading-relaxed text-slate-800 placeholder:text-slate-700 custom-scrollbar"
                  placeholder="Cole o conteúdo programático aqui... A IA vai analisar cada linha e montar a estrutura de Área > Matéria > Tópico > Subtópico."
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white shadow-sm p-8 px-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-200">
              <div className="flex items-center gap-4 text-slate-500">
                <Sparkles className="w-5 h-5 text-blue-800" />
                <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">Nossa IA converterá o texto em uma<br />grade de estudos interativa.</p>
              </div>
              <button
                onClick={handleParse}
                disabled={loading}
                className="w-full sm:w-auto bg-blue-900 text-white text-xs font-bold px-10 py-4 rounded-2xl uppercase tracking-[0.2em] hover:bg-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 active:scale-95"
              >
                {loading ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /><span>Processando Edital...</span></>
                ) : (
                   <><span>Verticalizar Agora</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
