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
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC]">
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 leading-tight">Importar Edital</h2>
          <p className="text-xs text-slate-500 font-mono">Verticalização // STUDY_SYSTEM_CORE</p>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-[11px] font-mono">
              {error}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Título do Concurso
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow text-sm"
                  placeholder="Ex: Polícia Federal 2024"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Texto Bruto do Edital
                </label>
                <textarea
                  className="w-full h-80 px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow resize-none font-mono text-[11px] leading-relaxed text-slate-700"
                  placeholder="Cole o conteúdo programático aqui..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={handleParse}
                disabled={loading}
                className="bg-indigo-600 text-white text-[11px] font-bold px-6 py-2 rounded uppercase tracking-wider hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                   <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Processando...</span></>
                ) : (
                   <span>Verticalizar Edital</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
