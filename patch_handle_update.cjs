const fs = require('fs');
let content = fs.readFileSync('src/components/StudyCycles.tsx', 'utf-8');

const oldHandle = `const handleUpdateSubjectParam = (index: number, field: 'questoes' | 'peso' | 'tempoManual', value: number) => {
    const newParams = [...subjectsParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setSubjectsParams(newParams);
  };`;

const newHandle = `const handleUpdateSubjectParam = (index: number, field: 'questoes' | 'peso' | 'tempoManual', value: number) => {
    setSubjectsParams(prev => {
      const newParams = [...prev];
      newParams[index] = { ...newParams[index], [field]: value };
      return newParams;
    });
  };

  const handleUpdateSubjectParamsMultiple = (index: number, updates: Partial<{questoes: number, peso: number, tempoManual: number}>) => {
    setSubjectsParams(prev => {
      const newParams = [...prev];
      newParams[index] = { ...newParams[index], ...updates };
      return newParams;
    });
  };`;

content = content.replace(oldHandle, newHandle);

const oldQtd = `onChange={(e) => {
                                      handleUpdateSubjectParam(idx, 'questoes', parseInt(e.target.value) || 0);
                                      handleUpdateSubjectParam(idx, 'tempoManual', 0); // reset manual if they tweak weights
                                    }}`;

const newQtd = `onChange={(e) => {
                                      handleUpdateSubjectParamsMultiple(idx, { 
                                        questoes: parseInt(e.target.value) || 0,
                                        tempoManual: 0 
                                      });
                                    }}`;

content = content.replace(oldQtd, newQtd);

const oldPeso = `onChange={(e) => {
                                      handleUpdateSubjectParam(idx, 'peso', parseInt(e.target.value) || 0);
                                      handleUpdateSubjectParam(idx, 'tempoManual', 0); // reset manual if they tweak weights
                                    }}`;

const newPeso = `onChange={(e) => {
                                      handleUpdateSubjectParamsMultiple(idx, { 
                                        peso: parseInt(e.target.value) || 0,
                                        tempoManual: 0 
                                      });
                                    }}`;

content = content.replace(oldPeso, newPeso);
fs.writeFileSync('src/components/StudyCycles.tsx', content);
console.log('Patched handlers to avoid overwrite');
