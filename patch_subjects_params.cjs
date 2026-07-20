const fs = require('fs');
let content = fs.readFileSync('src/components/StudyCycles.tsx', 'utf-8');

const oldUpdate = `const handleUpdateSubjectParam = (index: number, field: 'questoes' | 'peso', value: number) => {
    const newParams = [...subjectsParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setSubjectsParams(newParams);
  };`;

const newUpdate = `const handleUpdateSubjectParam = (index: number, field: 'questoes' | 'peso', value: number) => {
    const newParams = [...subjectsParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setSubjectsParams(newParams);
  };

  const handleUpdateSubjectNameParam = (index: number, name: string) => {
    const newParams = [...subjectsParams];
    newParams[index] = { ...newParams[index], nome: name };
    setSubjectsParams(newParams);
  };

  const handleRemoveSubjectParam = (index: number) => {
    setSubjectsParams(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSubjectParam = () => {
    setSubjectsParams(prev => [...prev, { nome: "Nova Matéria", questoes: 10, peso: 1 }]);
  };`;

content = content.replace(oldUpdate, newUpdate);
fs.writeFileSync('src/components/StudyCycles.tsx', content);
console.log('Patched handlers');
