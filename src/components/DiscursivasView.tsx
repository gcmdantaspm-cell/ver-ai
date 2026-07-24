import React, { useState } from 'react';
import { useEdital } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Plus, X, FileText, CheckCircle2, Circle, TrendingUp, Calendar, Trash2, Edit2, Check, BarChart } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Discursiva } from '../types';

export function DiscursivasView() {
  const { discursivas, addDiscursiva, updateDiscursiva, deleteDiscursiva, toggleDiscursiva } = useEdital();
  const [showAddModal, setShowAddModal] = useState(false);
  const [inputText, setInputText] = useState("");
  const [selectedDiscursiva, setSelectedDiscursiva] = useState<Discursiva | null>(null);

  // Edit states for the selected discursiva
  const [editMax, setEditMax] = useState<number>(0);
  const [editObtida, setEditObtida] = useState<number>(0);
  const [editTextoBase, setEditTextoBase] = useState("");
  const [editComando, setEditComando] = useState("");
  const [editResposta, setEditResposta] = useState("");

  const concluídas = discursivas.filter(d => d.concluido).length;
  const total = discursivas.length;

  const handleParseText = () => {
    if (!inputText.trim()) return;
    const lines = inputText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    lines.forEach(line => {
      addDiscursiva({
        id: uuidv4(),
        topico: line,
        concluido: false,
        pontuacaoMaxima: 100,
        pontuacaoObtida: 0,
        textoBase: "",
        comandoQuestao: "",
        minhaResposta: "",
        dataCriacao: new Date().toISOString()
      });
    });
    setInputText("");
    setShowAddModal(false);
  };

  const handleOpenDiscursiva = (d: Discursiva) => {
    setSelectedDiscursiva(d);
    setEditMax(d.pontuacaoMaxima);
    setEditObtida(d.pontuacaoObtida);
    setEditTextoBase(d.textoBase || "");
    setEditComando(d.comandoQuestao || "");
    setEditResposta(d.minhaResposta || "");
  };

  const handleSaveDiscursiva = () => {
    if (!selectedDiscursiva) return;
    updateDiscursiva({
      ...selectedDiscursiva,
      pontuacaoMaxima: editMax,
      pontuacaoObtida: editObtida,
      textoBase: editTextoBase,
      comandoQuestao: editComando,
      minhaResposta: editResposta
    });
    setSelectedDiscursiva(null);
  };

  const chartData = discursivas
    .filter(d => d.concluido && d.dataConclusao)
    .sort((a, b) => new Date(a.dataConclusao!).getTime() - new Date(b.dataConclusao!).getTime())
    .map(d => ({
      data: format(new Date(d.dataConclusao!), 'dd/MM', { locale: ptBR }),
      nota: (d.pontuacaoObtida / (d.pontuacaoMaxima || 1)) * 100, // percentage for uniform chart
      topico: d.topico
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-800 max-w-[200px]">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-blue-400 mb-1">{payload[0].payload.topico}</p>
          <p className="text-emerald-400 font-mono">Nota: {payload[0].value.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Mapa da Discursiva</h2>
          <p className="text-slate-500">Acompanhe suas redações e questões discursivas.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Importar Tópicos
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {discursivas.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhuma Discursiva</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">Adicione tópicos para começar a praticar e acompanhar sua evolução em provas discursivas.</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-bold transition-all inline-flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar Tópicos
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {discursivas.map((d) => (
                  <div key={d.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors group">
                    <button 
                      onClick={() => toggleDiscursiva(d.id)}
                      className="mt-0.5 text-slate-300 hover:text-emerald-500 flex-shrink-0"
                    >
                      {d.concluido ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                    </button>
                    <div className="flex-1 min-w-0" onClick={() => handleOpenDiscursiva(d)}>
                      <h4 className={`text-sm font-medium cursor-pointer transition-colors ${d.concluido ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{d.topico}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        {d.concluido && (
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              Nota: {d.pontuacaoObtida} / {d.pontuacaoMaxima}
                            </span>
                          </div>
                        )}
                        {d.dataConclusao && (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(d.dataConclusao), "dd MMM, yyyy", { locale: ptBR })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenDiscursiva(d)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Detalhes"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm("Deseja remover este tópico?")) {
                            deleteDiscursiva(d.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Evolução das Notas (%)
            </h3>
            <div className="h-48 w-full">
              {chartData.length >= 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorNota" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} domain={[0, 100]} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="nota" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorNota)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                  <BarChart className="w-8 h-8 mb-2 opacity-20" />
                  <p>Conclua pelo menos 2 discursivas<br/>para ver o gráfico.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-20 -mr-10 -mt-10"></div>
            <h3 className="text-sm font-bold text-slate-300 mb-1">Resumo</h3>
            <div className="text-3xl font-bold mb-4">{concluídas} <span className="text-slate-500 text-lg">/ {total}</span></div>
            <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
                style={{ width: `${total > 0 ? (concluídas / total) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-400 text-right">{total > 0 ? Math.round((concluídas / total) * 100) : 0}% de progresso</div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Importar Tópicos</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Tópicos (um por linha)</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all resize-none"
                  placeholder="Ex:&#10;Poder de Polícia&#10;Controle de Constitucionalidade&#10;Atos Administrativos"
                ></textarea>
                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleParseText}
                    disabled={!inputText.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-blue-600/20"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {selectedDiscursiva && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setSelectedDiscursiva(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[85dvh] mx-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 line-clamp-1 pr-8" title={selectedDiscursiva.topico}>
                    {selectedDiscursiva.topico}
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-500">Nota Obtida</label>
                      <input 
                        type="number"
                        value={editObtida}
                        onChange={(e) => setEditObtida(parseFloat(e.target.value) || 0)}
                        className="w-20 text-sm font-bold text-emerald-600 bg-white border border-slate-200 rounded-md px-2 py-1 outline-none focus:border-emerald-500"
                        step="0.1"
                      />
                    </div>
                    <span className="text-slate-300">/</span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-500">Nota Máxima</label>
                      <input 
                        type="number"
                        value={editMax}
                        onChange={(e) => setEditMax(parseFloat(e.target.value) || 0)}
                        className="w-20 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-md px-2 py-1 outline-none focus:border-blue-500"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDiscursiva(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors self-start"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50 custom-scrollbar">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    Texto Base
                  </label>
                  <textarea
                    value={editTextoBase}
                    onChange={(e) => setEditTextoBase(e.target.value)}
                    className="w-full h-32 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all resize-y"
                    placeholder="Cole o texto motivador aqui..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    Comando da Questão
                  </label>
                  <textarea
                    value={editComando}
                    onChange={(e) => setEditComando(e.target.value)}
                    className="w-full h-24 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all resize-y"
                    placeholder="O que a questão pede?"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-slate-400" />
                    Minha Resposta
                  </label>
                  <textarea
                    value={editResposta}
                    onChange={(e) => setEditResposta(e.target.value)}
                    className="w-full h-64 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all resize-y font-serif leading-relaxed"
                    placeholder="Sua redação/resposta..."
                  ></textarea>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white flex-shrink-0">
                <button 
                  onClick={() => setSelectedDiscursiva(null)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveDiscursiva}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-blue-600/20 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
