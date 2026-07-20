const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf-8');

const oldSub = `  useEffect(() => {
    if (!user) {
      setEditais([]);
      setCiclos([]);
      return;
    }`;

const newSub = `  useEffect(() => {
    if (!user) {
      setEditais([]);
      setCiclos([]);
      setDiscursivas([]);
      return;
    }`;

content = content.replace(oldSub, newSub);

const oldSubCiclos = `    const unsubscribeCiclos = onSnapshot(cq, (snapshot) => {
      const data = snapshot.docs.map(changeDoc => ({
        id: changeDoc.id,
        ...changeDoc.data()
      })) as StudyCycle[];
      setCiclos(data.sort((a, b) => (a.ordem || 0) - (b.ordem || 0)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "ciclos");
    });`;

const newSubCiclos = `    const unsubscribeCiclos = onSnapshot(cq, (snapshot) => {
      const data = snapshot.docs.map(changeDoc => ({
        id: changeDoc.id,
        ...changeDoc.data()
      })) as StudyCycle[];
      setCiclos(data.sort((a, b) => (a.ordem || 0) - (b.ordem || 0)));
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
    });`;

content = content.replace(oldSubCiclos, newSubCiclos);

const oldReturn = `    return () => {
      unsubscribeEditais();
      unsubscribeCiclos();
    };
  }, [user]);`;

const newReturn = `    return () => {
      unsubscribeEditais();
      unsubscribeCiclos();
      unsubscribeDiscursivas();
    };
  }, [user]);`;

content = content.replace(oldReturn, newReturn);

fs.writeFileSync('src/store.tsx', content);
console.log('Patched subscriptions');
