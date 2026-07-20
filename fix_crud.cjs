const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf-8');

const toRemove = `  const addDiscursiva = (d: Discursiva) => {
    if (!user) return;
    setDoc(doc(db, "discursivas", d.id), JSON.parse(JSON.stringify({ ...d, userId: user.uid }))).catch(err => {
      handleFirestoreError(err, OperationType.ADD, "discursivas");
    });
  };

  const updateDiscursiva = (d: Discursiva) => {
    if (!user) return;
    setDoc(doc(db, "discursivas", d.id), JSON.parse(JSON.stringify({ ...d, userId: user.uid }))).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, \`discursivas/\${d.id}\`);
    });
  };

  const deleteDiscursiva = (id: string) => {
    if (!user) return;
    deleteDoc(doc(db, "discursivas", id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, \`discursivas/\${id}\`);
    });
  };

  const toggleDiscursiva = (id: string) => {
    if (!user) return;
    const d = discursivas.find(x => x.id === id);
    if (d) {
      updateDiscursiva({ ...d, concluido: !d.concluido, dataConclusao: !d.concluido ? new Date().toISOString() : undefined });
    }
  };`;

content = content.replace(toRemove, '');

const toInsert = `  const addCiclo = (ciclo: StudyCycle) => {`;
const newInsert = `${toRemove}

  const addCiclo = (ciclo: StudyCycle) => {`;

content = content.replace(toInsert, newInsert);

fs.writeFileSync('src/store.tsx', content);
