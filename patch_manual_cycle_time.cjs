const fs = require('fs');
let content = fs.readFileSync('src/components/StudyCycles.tsx', 'utf-8');

const oldManualCycle = `const handleAddManualCycle = () => {
    let edital = undefined;
    if (isManagedMode && selectedEditalId) {
      edital = editais.find(e => e.id === selectedEditalId);
    }
    const newCycle: StudyCycle = {
      id: uuidv4(),
      editalId: selectedEditalId || "",
      userId: isManagedMode && edital ? edital.userId : undefined,
      managedBy: isManagedMode ? auth.currentUser?.uid : undefined,
      nome: \`Novo Ciclo \${ciclos.length + 1}\`,
      items: subjectsParams.map(s => ({
        id: uuidv4(),
        materiaId: uuidv4(),
        materiaNome: s.nome,
        duracao: s.tempoManual || 60,
        concluido: false
      })),
      created_at: new Date().toISOString()
    };
    addCiclo(newCycle);`;

const newManualCycle = `const handleAddManualCycle = () => {
    let edital = undefined;
    if (isManagedMode && selectedEditalId) {
      edital = editais.find(e => e.id === selectedEditalId);
    }
    
    const totalMinutesAllCycles = numCycles * cycleHours * 60;
    const totalPoints = subjectsParams.reduce((acc, s) => acc + (s.questoes * s.peso), 0);

    const newCycle: StudyCycle = {
      id: uuidv4(),
      editalId: selectedEditalId || "",
      userId: isManagedMode && edital ? edital.userId : undefined,
      managedBy: isManagedMode ? auth.currentUser?.uid : undefined,
      nome: \`Novo Ciclo \${ciclos.length + 1}\`,
      items: subjectsParams.map(s => {
        const proportion = totalPoints > 0 ? (s.questoes * s.peso) / totalPoints : 0;
        let calcTotalMins = Math.max(30, Math.round(proportion * totalMinutesAllCycles));
        calcTotalMins = Math.max(30, Math.round(calcTotalMins / 5) * 5);
        const calcPerCycle = Math.round(calcTotalMins / (numCycles || 1));
        
        return {
          id: uuidv4(),
          materiaId: uuidv4(),
          materiaNome: s.nome,
          duracao: s.tempoManual || calcPerCycle || 60,
          concluido: false
        };
      }),
      created_at: new Date().toISOString(),
      targetMinutes: cycleHours * 60
    };
    addCiclo(newCycle);`;

if (content.includes(oldManualCycle)) {
  content = content.replace(oldManualCycle, newManualCycle);
  fs.writeFileSync('src/components/StudyCycles.tsx', content);
  console.log('Patched manual cycle to use calculated time');
} else {
  console.log('Could not find oldManualCycle block');
}
