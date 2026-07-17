const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('setPinnedEditalId')) {
  content = content.replace(/import {([^}]+)} from "lucide-react";/, 'import { $1, Pin } from "lucide-react";');
  content = content.replace(/const { editais } = useEdital\(\);/, 'const { editais, pinnedEditalId, setPinnedEditalId } = useEdital();');
  
  const originalSidebarItem = `{editais.map(edital => (
                  <button
                    key={edital.id}
                    onClick={() => navigateTo(\`edital-\${edital.id}\`)}
                    className={\`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 border \${currentView === \`edital-\${edital.id}\` ? "bg-blue-900 text-white shadow-md border-transparent" : "text-slate-500 hover:bg-slate-100 border-transparent"}\`}
                  >
                      <BookOpen className="w-5 h-5 shrink-0" />
                      <span className="truncate">{edital.titulo}</span>
                  </button>
                ))}`;
                
  const newSidebarItem = `{editais.map(edital => (
                  <div key={edital.id} className="relative group">
                    <button
                      onClick={() => navigateTo(\`edital-\${edital.id}\`)}
                      className={\`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium mb-1 border pr-10 \${currentView === \`edital-\${edital.id}\` ? "bg-blue-900 text-white shadow-md border-transparent" : "text-slate-500 hover:bg-slate-100 border-transparent"}\`}
                    >
                        <BookOpen className="w-5 h-5 shrink-0" />
                        <span className="truncate flex-1">{edital.titulo}</span>
                    </button>
                    {setPinnedEditalId && (
                      <button 
                        onClick={() => setPinnedEditalId(pinnedEditalId === edital.id ? null : edital.id)}
                        className={\`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all \${pinnedEditalId === edital.id ? 'opacity-100 text-amber-500' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-amber-500 hover:bg-slate-100'}\`}
                        title={pinnedEditalId === edital.id ? "Desafixar Edital" : "Fixar Edital como Padrão"}
                      >
                        <Pin className={\`w-4 h-4 \${pinnedEditalId === edital.id ? 'fill-current' : ''}\`}/>
                      </button>
                    )}
                  </div>
                ))}`;

  content = content.replace(originalSidebarItem, newSidebarItem);
  fs.writeFileSync('src/App.tsx', content);
  console.log('Patched Sidebar Pin');
}
