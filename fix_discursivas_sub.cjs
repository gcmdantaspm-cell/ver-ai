const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf-8');

const toReplace = `    const qManagedCiclos = query(collection(db, "ciclos"), where("managedBy", "==", user.uid));
    const unsubscribeManagedCiclos = onSnapshot(qManagedCiclos, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const obj = doc.data();
        obj.id = doc.id;
        return obj as StudyCycle;
      });
      setManagedCiclos(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "ciclos");
    });

  

  return () => {
      unsubscribeEditais();
      unsubscribeCiclos();
      unsubscribeManagedEditais();
      unsubscribeManagedCiclos();
    };
  }, [user]);`;

const newCode = `    const qManagedCiclos = query(collection(db, "ciclos"), where("managedBy", "==", user.uid));
    const unsubscribeManagedCiclos = onSnapshot(qManagedCiclos, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const obj = doc.data();
        obj.id = doc.id;
        return obj as StudyCycle;
      });
      setManagedCiclos(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "ciclos");
    });

    const dq = query(collection(db, "discursivas"), where("userId", "==", user.uid));
    const unsubscribeDiscursivas = onSnapshot(dq, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Discursiva[];
      setDiscursivas(data.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "discursivas");
    });

  return () => {
      unsubscribeEditais();
      unsubscribeCiclos();
      unsubscribeManagedEditais();
      unsubscribeManagedCiclos();
      unsubscribeDiscursivas();
    };
  }, [user]);`;

content = content.replace(toReplace, newCode);

fs.writeFileSync('src/store.tsx', content);
