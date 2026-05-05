import * as fs from "fs";

function replaceInFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Backgrounds
    content = content.replace(/bg-\[#0b1120\]/gi, "bg-slate-50");
    content = content.replace(/bg-\[#030712\]/gi, "bg-slate-50");
    content = content.replace(/bg-\[#111827\]/gi, "bg-white");
    content = content.replace(/bg-\[#1E293B\]/gi, "bg-slate-100");
    
    // white/5 -> slate-200, etc.
    content = content.replace(/border-slate-800/gi, "border-slate-200");
    content = content.replace(/border-white\/5/gi, "border-slate-200");
    content = content.replace(/border-white\/10/gi, "border-slate-300");
    content = content.replace(/border-white\/20/gi, "border-slate-300");
    content = content.replace(/bg-white\/\[0\.01\]/gi, "bg-white");
    content = content.replace(/bg-white\/\[0\.02\]/gi, "bg-white shadow-sm");
    content = content.replace(/bg-white\/\[0\.03\]/gi, "bg-slate-50");
    content = content.replace(/bg-white\/\[0\.04\]/gi, "bg-slate-100");
    content = content.replace(/bg-white\/5/gi, "bg-slate-100");
    content = content.replace(/bg-white\/10/gi, "bg-slate-200");
    content = content.replace(/bg-white\/20/gi, "bg-slate-300");
    content = content.replace(/hover:bg-white\/\[0\.01\]/gi, "hover:bg-slate-50");
    content = content.replace(/hover:bg-white\/\[0\.02\]/gi, "hover:bg-slate-50");
    content = content.replace(/hover:bg-white\/\[0\.04\]/gi, "hover:bg-slate-100");
    content = content.replace(/hover:bg-white\/5/gi, "hover:bg-slate-100");
    content = content.replace(/hover:bg-white\/10/gi, "hover:bg-slate-200");
    content = content.replace(/hover:border-white\/10/gi, "hover:border-slate-300");
    
    // Indigo -> Navy Blue
    content = content.replace(/indigo-400/gi, "blue-800");
    content = content.replace(/indigo-500/gi, "blue-900");
    content = content.replace(/indigo-600/gi, "blue-900");
    
    // Texts
    content = content.replace(/text-white/gi, "text-slate-900");
    content = content.replace(/text-slate-100/gi, "text-slate-900");
    content = content.replace(/text-slate-200/gi, "text-slate-800");
    content = content.replace(/text-slate-300/gi, "text-slate-800");
    content = content.replace(/text-slate-400/gi, "text-slate-600");
    content = content.replace(/text-slate-500/gi, "text-slate-500");
    content = content.replace(/text-slate-600/gi, "text-slate-400");
    
    // hover texts
    content = content.replace(/hover:text-white/gi, "hover:text-slate-900");
    
    // fix the checklist icon text
    content = content.replace(/text-\[#030712\]/gi, "text-white");
    content = content.replace(/bg-slate-900/gi, "bg-white"); // Just in case peer-checked:bg-white became bg-slate-900
    
    fs.writeFileSync(filePath, content, 'utf8');
}

['src/App.tsx', 'src/components/Dashboard.tsx', 'src/components/ParseEdital.tsx', 'src/components/EditalView.tsx', 'src/components/Pomodoro.tsx'].forEach(replaceInFile);
