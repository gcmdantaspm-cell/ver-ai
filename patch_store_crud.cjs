const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf-8');

const crudFunctions = `
  const addDiscursiva = (d: Discursiva) => {
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
  };
`;

const insertAfter = `  const getPublicCiclos = async (editalId: string): Promise<StudyCycle[]> => {
    try {
      const q = query(collection(db, "ciclos"), where("editalId", "==", editalId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as StudyCycle);
    } catch (error) {
      console.error("Error fetching public cycles:", error);
      return [];
    }
  };`;

content = content.replace(insertAfter, insertAfter + crudFunctions);

const oldProviderValueEnd = `getPublicCiclos
      }}
    >
      {children}
    </EditalContext.Provider>
  );
}`;

const newProviderValueEnd = `getPublicCiclos,
        discursivas,
        addDiscursiva,
        updateDiscursiva,
        deleteDiscursiva,
        toggleDiscursiva
      }}
    >
      {children}
    </EditalContext.Provider>
  );
}`;

content = content.replace(oldProviderValueEnd, newProviderValueEnd);

fs.writeFileSync('src/store.tsx', content);
console.log('Patched Discursiva CRUD');
