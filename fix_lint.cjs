const fs = require('fs');

// Fix Dashboard.tsx
let dashboard = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');
dashboard = dashboard.replace(/const \{([^}]+pinnedEditalId[^}]*)\} = useEdital\(\);/g, (match, group) => {
  if (!group.includes('setPinnedEditalId')) {
    return `const { ${group.trim()}, setPinnedEditalId } = useEdital();`;
  }
  return match;
});
// in case there's another occurrence of setPinnedEditalId not defined
if (!dashboard.includes('setPinnedEditalId } = useEdital')) {
   dashboard = dashboard.replace(/const \{[^}]+\} = useEdital\(\);/, 'const { editais, revisions, completeRevision, pinnedEditalId, setPinnedEditalId } = useEdital();');
}

fs.writeFileSync('src/components/Dashboard.tsx', dashboard);


// Fix RevisaoSugestoes.tsx
let revisao = fs.readFileSync('src/components/RevisaoSugestoes.tsx', 'utf-8');
revisao = revisao.replace(/const \{([^}]+pinnedEditalId[^}]*)\} = useEdital\(\);/g, (match, group) => {
  if (!group.includes('setPinnedEditalId')) {
    return `const { ${group.trim()}, setPinnedEditalId, updateCartoes } = useEdital();`;
  }
  return match;
});
if (!revisao.includes('setPinnedEditalId, updateCartoes } = useEdital')) {
   revisao = revisao.replace(/const \{[^}]+\} = useEdital\(\);/, 'const { editais, pinnedEditalId, setPinnedEditalId, updateCartoes } = useEdital();');
}

// Fix generateFlashcards
revisao = revisao.replace(/const generated = await generateFlashcards\(promptText\);/, 'const generated = await generateFlashcards(materia?.nome || "", topico?.titulo || "", subtopico?.titulo, cartoesBaseText.trim());');

fs.writeFileSync('src/components/RevisaoSugestoes.tsx', revisao);

console.log('Fixed');
