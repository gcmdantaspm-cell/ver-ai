const fs = require('fs');
let content = fs.readFileSync('src/components/StudyCycles.tsx', 'utf-8');

// Make the edit/delete buttons partially visible always
content = content.replace('opacity-0 group-hover/item:opacity-100 transition-opacity', 'opacity-50 group-hover/item:opacity-100 transition-opacity');

// Change the tooltip or icon for the edit subject button
content = content.replace('className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"\n                      >\n                        <Edit2 className="w-3 h-3" />\n                      </button>', 'className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all" title="Editar matéria/peso"\n                      >\n                        <Edit2 className="w-3 h-3" />\n                      </button>');

// Make the target label clearer
content = content.replace('<Clock className="w-3 h-3 text-slate-400" />\n                          <input', '<Clock className="w-3 h-3 text-slate-400" title="Tempo/Peso" />\n                          <input title="Tempo/Peso (minutos)"');

fs.writeFileSync('src/components/StudyCycles.tsx', content);
console.log('Patched subject edit UI');
