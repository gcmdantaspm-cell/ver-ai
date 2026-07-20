const fs = require('fs');
let content = fs.readFileSync('src/components/StudyCycles.tsx', 'utf-8');
content = content.replace(
  '<div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Peso e Questões por Matéria</div>',
  '<div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Peso e Questões por Matéria</div>\n<p className="text-[10px] text-slate-400 mb-3 leading-tight">Aumente o peso ou o número de questões para que a IA destine <b>mais tempo</b> a essa matéria. Remova ou adicione matérias livremente.</p>'
);
fs.writeFileSync('src/components/StudyCycles.tsx', content);
