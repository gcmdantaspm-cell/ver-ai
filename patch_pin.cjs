const fs = require('fs');

function addPinToSelect(file) {
  let content = fs.readFileSync(file, 'utf-8');
  
  if (!content.includes('Pin')) {
    content = content.replace(/import {([^}]+)} from ["']lucide-react["']/, 'import { $1, Pin } from "lucide-react"');
  }

  // Find the select block
  content = content.replace(/<select([\s\S]*?)<\/select>/, (match) => {
    return `<div className="flex items-center gap-2">
            ${match}
            {selectedEditalId !== 'all' && setPinnedEditalId && (
              <button 
                onClick={() => setPinnedEditalId(pinnedEditalId === selectedEditalId ? null : selectedEditalId)}
                className={\`p-2 flex items-center justify-center rounded-xl transition-all border \${pinnedEditalId === selectedEditalId ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:text-amber-500'}\`}
                title={pinnedEditalId === selectedEditalId ? "Desafixar Edital" : "Fixar Edital como Padrão"}
              >
                <Pin className={\`w-4 h-4 \${pinnedEditalId === selectedEditalId ? 'fill-current' : ''}\`} />
              </button>
            )}
          </div>`;
  });

  if (file === 'src/components/Dashboard.tsx' && !content.includes('setPinnedEditalId')) {
    content = content.replace(/const { editais, revisions, completeRevision, pinnedEditalId } = useEdital\(\);/, 'const { editais, revisions, completeRevision, pinnedEditalId, setPinnedEditalId } = useEdital();');
  }

  if (file === 'src/components/RevisaoSugestoes.tsx' && !content.includes('setPinnedEditalId')) {
    content = content.replace(/const { editais, pinnedEditalId } = useEdital\(\);/, 'const { editais, pinnedEditalId, setPinnedEditalId } = useEdital();');
  }

  fs.writeFileSync(file, content);
  console.log('Patched', file);
}

function addPinToStudyCycles(file) {
  let content = fs.readFileSync(file, 'utf-8');
  
  if (!content.includes('Pin')) {
    content = content.replace(/import {([^}]+)} from ["']lucide-react["']/, 'import { $1, Pin } from "lucide-react"');
  }

  // Study cycles has `filterEditalId` instead of `selectedEditalId`
  content = content.replace(/<select([\s\S]*?)onChange=\{\(e\) => setFilterEditalId\(e\.target\.value\)\}([\s\S]*?)<\/select>/, (match) => {
    return `<div className="flex items-center gap-2">
            ${match}
            {filterEditalId !== 'all' && setPinnedEditalId && (
              <button 
                onClick={() => setPinnedEditalId(pinnedEditalId === filterEditalId ? null : filterEditalId)}
                className={\`p-2 flex items-center justify-center rounded-xl transition-all border \${pinnedEditalId === filterEditalId ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:text-amber-500'}\`}
                title={pinnedEditalId === filterEditalId ? "Desafixar Edital" : "Fixar Edital como Padrão"}
              >
                <Pin className={\`w-4 h-4 \${pinnedEditalId === filterEditalId ? 'fill-current' : ''}\`} />
              </button>
            )}
          </div>`;
  });

  if (!content.includes('setPinnedEditalId } = useEdital')) {
    content = content.replace(/toggleCicloItem, pinnedEditalId } = useEdital/, 'toggleCicloItem, pinnedEditalId, setPinnedEditalId } = useEdital');
  }

  fs.writeFileSync(file, content);
  console.log('Patched', file);
}

addPinToSelect('src/components/Dashboard.tsx');
addPinToSelect('src/components/RevisaoSugestoes.tsx');
addPinToStudyCycles('src/components/StudyCycles.tsx');

