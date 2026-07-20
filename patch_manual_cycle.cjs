const fs = require('fs');
let content = fs.readFileSync('src/components/StudyCycles.tsx', 'utf-8');

const oldCode = `const newCycle: StudyCycle = {
      id: uuidv4(),
      editalId: selectedEditalId || "",
      userId: isManagedMode && edital ? edital.userId : undefined,
      managedBy: isManagedMode ? auth.currentUser?.uid : undefined,
      nome: \`Novo Ciclo \${ciclos.length + 1}\`,
      items: [],
      created_at: new Date().toISOString()
    };`;

const newCode = `const newCycle: StudyCycle = {
      id: uuidv4(),
      editalId: selectedEditalId || "",
      userId: isManagedMode && edital ? edital.userId : undefined,
      managedBy: isManagedMode ? auth.currentUser?.uid : undefined,
      nome: \`Novo Ciclo \${ciclos.length + 1}\`,
      items: subjectsParams.map(s => ({
        id: uuidv4(),
        materiaId: uuidv4(),
        materiaNome: s.nome,
        duracao: 60,
        concluido: false
      })),
      created_at: new Date().toISOString()
    };`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync('src/components/StudyCycles.tsx', content);
  console.log('Patched manual cycle creation');
} else {
  console.log('Could not find old code block');
}
