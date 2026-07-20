const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const importRevisao = 'import { RevisaoSugestoes } from "./components/RevisaoSugestoes";';
const importDiscursivas = 'import { DiscursivasView } from "./components/DiscursivasView";';

content = content.replace(importRevisao, importRevisao + '\\n' + importDiscursivas);

const iconImport = 'import {  LayoutDashboard, FileText, Plus, BookOpen, Menu, X, ChevronDown, LogOut, Loader2, History, Target, Users, Layers, AlertTriangle , Pin } from "lucide-react";';
const newIconImport = 'import {  LayoutDashboard, FileText, Plus, BookOpen, Menu, X, ChevronDown, LogOut, Loader2, History, Target, Users, Layers, AlertTriangle , Pin, PenTool } from "lucide-react";';

content = content.replace(iconImport, newIconImport);

fs.writeFileSync('src/App.tsx', content);
