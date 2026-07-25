const fs = require('fs');
const content = fs.readFileSync('src/store.tsx', 'utf-8');

const oldCompleteRev = `    if (targetEdital) {
       handleUpdate(targetEdital.id, (edital) => {
          for (const area of edital.areas || []) {
            for (const materia of area.materias || []) {
              for (const topico of materia?.topicos || []) {
                if (topico.id === itemId) {
                  topico.revisoes_agendadas = topico.revisoes_agendadas.filter(r => r !== dataRevisao);
                  topico.revisoes_concluidas = (topico.revisoes_concluidas || 0) + 1;
                }
                for (const sub of topico?.subtopicos || []) {
                  if (sub.id === itemId) {
                    sub.revisoes_agendadas = sub.revisoes_agendadas.filter(r => r !== dataRevisao);
                    sub.revisoes_concluidas = (sub.revisoes_concluidas || 0) + 1;
                  }
                }
              }
            }
          }
       });
    }`;

const newCompleteRev = `    if (targetEdital) {
       handleUpdate(targetEdital.id, (edital) => {
          for (const area of edital.areas || []) {
            for (const materia of area.materias || []) {
              for (const topico of materia?.topicos || []) {
                if (topico.id === itemId) {
                  topico.revisoes_agendadas = topico.revisoes_agendadas.filter(r => r !== dataRevisao);
                  topico.revisoes_concluidas = (topico.revisoes_concluidas || 0) + 1;
                }
                for (const sub of topico?.subtopicos || []) {
                  if (sub.id === itemId) {
                    sub.revisoes_agendadas = sub.revisoes_agendadas.filter(r => r !== dataRevisao);
                    sub.revisoes_concluidas = (sub.revisoes_concluidas || 0) + 1;
                  }
                  for (const subsub of sub.subitens || []) {
                    if (subsub.id === itemId) {
                      subsub.revisoes_agendadas = subsub.revisoes_agendadas.filter(r => r !== dataRevisao);
                      subsub.revisoes_concluidas = (subsub.revisoes_concluidas || 0) + 1;
                    }
                  }
                }
              }
            }
          }
       });
    }`;

let newFileContent = content.replace(oldCompleteRev, newCompleteRev);

fs.writeFileSync('src/store.tsx', newFileContent);
console.log("Patched");
