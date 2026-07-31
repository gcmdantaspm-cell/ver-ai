const fs = require('fs');

let content = fs.readFileSync('src/components/McpSettingsView.tsx', 'utf8');

const oldGuide = `<div className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs mb-3">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Pronto!</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clique em <strong className="text-slate-700">Próximo / Conectar</strong>. O Gemini validará o protocolo JSON-RPC e ativará as ferramentas de consulta ao seu edital!
              </p>`;

const newGuide = `<div className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs mb-3">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Aviso sobre Vercel</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Se for usar seu próprio domínio (como Vercel), lembre-se de <strong>fazer um novo deploy (commit)</strong> com as pastas <code className="bg-slate-200 p-0.5 rounded">/api</code> criadas para suportar o servidor!
              </p>`;

content = content.replace(oldGuide, newGuide);
fs.writeFileSync('src/components/McpSettingsView.tsx', content);
console.log("Patched UI");
