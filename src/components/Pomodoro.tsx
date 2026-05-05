import { useState, useEffect } from "react";
import { Timer, Play, Square, RefreshCcw, X } from "lucide-react";

export function FloatingPomodoro() {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((time) => time - 1), 1000);
    } else if (timeLeft === 0) {
      if (isActive) {
        // Auto-switch modes or just stop. Let's just stop and alert.
        setIsActive(false);
        alert(mode === 'study' ? 'Sessão de estudos concluída! Hora da pausa.' : 'Pausa finalizada! Volte aos estudos.');
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'study' ? 25 * 60 : 5 * 60);
  };

  const setStudyMode = () => {
    setMode('study');
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const setBreakMode = () => {
    setMode('break');
    setIsActive(false);
    setTimeLeft(5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white text-slate-800 border border-slate-100/80 rounded-3xl p-5 shadow-2xl shadow-indigo-100/50 mb-4 w-64 animate-in slide-in-from-bottom flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-5">
             <div className="flex bg-slate-50 font-medium rounded-xl p-1 border border-slate-100">
               <button 
                  onClick={setStudyMode} 
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-widest rounded-lg transition-colors ${mode === 'study' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Foco
               </button>
               <button 
                  onClick={setBreakMode} 
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-widest rounded-lg transition-colors ${mode === 'break' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Pausa
               </button>
             </div>
             <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                <X className="w-4 h-4" />
             </button>
          </div>
          
          <div className="text-5xl font-mono font-bold text-slate-700 tracking-tight mb-6">
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-3 w-full">
             <button 
               onClick={toggleTimer} 
               className={`flex-1 py-3 rounded-2xl flex justify-center items-center gap-2 font-bold text-xs uppercase tracking-widest transition-all ${isActive ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'}`}
             >
                {isActive ? <><Square className="w-4 h-4" fill="currentColor"/> Parar</> : <><Play className="w-4 h-4" fill="currentColor"/> Iniciar</>}
             </button>
             <button 
               onClick={resetTimer}
               className="w-12 h-12 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 rounded-2xl flex justify-center items-center transition-colors shadow-sm"
               title="Restaurar"
             >
                <RefreshCcw className="w-4 h-4" />
             </button>
          </div>
        </div>
      )}
      
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 rounded-full shadow-xl shadow-indigo-600/30 flex items-center justify-center transition-transform hover:scale-110"
        >
           <Timer className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
