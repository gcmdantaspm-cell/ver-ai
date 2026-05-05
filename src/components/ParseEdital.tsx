import { useState } from "react";
import { parseEditalText } from "../services/ai";
import { useEdital } from "../store";
import { Loader2, PlusCircle, Check } from "lucide-react";
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
      setError("Falha ao processar o texto do edital. Ocorreu um erro na IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F7FA]">
        <header className="h-24 px-8 flex items-end pb-4 shrink-0">
          <div className="flex flex-col flex-1">
            <h2 className="text-2xl font-display font-bold text-slate-900 leading-tight">Importar Edital</h2>
            <p className="text-sm text-slate-500 font-medium">Verticalização via Inteligência Artificial</p>
          </div>
        </header>

      <div className="flex-1 px-8 pb-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-8 space-y-6 border-b border-slate-100/50">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Título do Concurso
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="Ex: Polícia Federal 2024"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Texto Bruto do Edital
                </label>
                <textarea
                  className="w-full h-[400px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all resize-none font-mono text-[13px] leading-relaxed text-slate-700 placeholder:text-slate-300"
                  placeholder="Cole o conteúdo programático aqui... A IA vai analisar cada linha e montar a estrutura de Área > Matéria > Tópico > Subtópico."
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-6 flex justify-end">
              <button
                onClick={handleParse}
                disabled={loading}
                className="bg-indigo-600 text-white text-sm font-bold px-8 py-3 rounded-xl uppercase tracking-widest hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-2 shadow-sm hover:shadow-md"
              >
                {loading ? (
                   <><Loader2 className="w-5 h-5 animate-spin" /><span>Analisando e Estruturando...</span></>
                ) : (
                   <span>Verticalizar Edital com IA</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
