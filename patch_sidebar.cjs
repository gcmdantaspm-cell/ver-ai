const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldBtn1 = `            <button
              onClick={() => navigateTo("cartoes_erros")}
              className={\`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 \${currentView === "cartoes_erros" ? "bg-blue-900 text-white shadow-md shadow-blue-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent"}\`}
            >
              <AlertTriangle className="w-4 h-4" /> Flashcards de Erros
            </button>`;

const newBtn1 = `            <button
              onClick={() => navigateTo("cartoes_erros")}
              className={\`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 \${currentView === "cartoes_erros" ? "bg-blue-900 text-white shadow-md shadow-blue-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent"}\`}
            >
              <AlertTriangle className="w-4 h-4" /> Flashcards de Erros
            </button>
            <button
              onClick={() => navigateTo("discursivas")}
              className={\`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 \${currentView === "discursivas" ? "bg-blue-900 text-white shadow-md shadow-blue-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent"}\`}
            >
              <PenTool className="w-4 h-4" /> Mapa da Discursiva
            </button>`;

content = content.replace(oldBtn1, newBtn1);

const oldMobileBtn1 = `            <button
              onClick={() => navigateTo("cartoes_erros")}
              className={\`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 border \${currentView === "cartoes_erros" ? "bg-blue-900 text-white shadow-md border-transparent" : "text-slate-500 hover:bg-slate-100 border-transparent"}\`}
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Flashcards de Erros</span>
            </button>`;

const newMobileBtn1 = `            <button
              onClick={() => navigateTo("cartoes_erros")}
              className={\`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 border \${currentView === "cartoes_erros" ? "bg-blue-900 text-white shadow-md border-transparent" : "text-slate-500 hover:bg-slate-100 border-transparent"}\`}
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Flashcards de Erros</span>
            </button>
            <button
              onClick={() => navigateTo("discursivas")}
              className={\`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 border \${currentView === "discursivas" ? "bg-blue-900 text-white shadow-md border-transparent" : "text-slate-500 hover:bg-slate-100 border-transparent"}\`}
            >
              <PenTool className="w-5 h-5" />
              <span>Mapa da Discursiva</span>
            </button>`;

content = content.replace(oldMobileBtn1, newMobileBtn1);

const oldViews = `{currentView === "cartoes_erros" && <CartoesErrosView />}
         {currentView === "import" && <ParseEdital onSuccess={() => navigateTo("dashboard")} />}`;

const newViews = `{currentView === "cartoes_erros" && <CartoesErrosView />}
         {currentView === "discursivas" && <DiscursivasView />}
         {currentView === "import" && <ParseEdital onSuccess={() => navigateTo("dashboard")} />}`;

content = content.replace(oldViews, newViews);

fs.writeFileSync('src/App.tsx', content);
console.log('Patched Sidebar');
