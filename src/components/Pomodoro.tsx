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
        <div className="bg-[#0B132B] text-white border border-[#1C2541] rounded-2xl p-4 shadow-2xl mb-4 w-64 animate-in slide-in-from-bottom flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4">
             <div className="flex bg-[#1C2541] rounded-lg p-1">
               <button 
                  onClick={setStudyMode} 
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${mode === 'study' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
               >
                 Foco
               </button>
               <button 
                  onClick={setBreakMode} 
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${mode === 'break' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
               >
                 Pausa
               </button>
             </div>
             <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
             </button>
          </div>
          
          <div className="text-5xl font-mono font-light tracking-tight mb-6">
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-3 w-full">
             <button 
               onClick={toggleTimer} 
               className={`flex-1 py-2 rounded-xl flex justify-center items-center gap-2 font-bold text-xs uppercase tracking-widest transition-colors ${isActive ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
             >
                {isActive ? <><Square className="w-4 h-4" fill="currentColor"/> Parar</> : <><Play className="w-4 h-4" fill="currentColor"/> Iniciar</>}
             </button>
             <button 
               onClick={resetTimer}
               className="w-10 h-10 bg-[#1C2541] hover:bg-slate-700 text-slate-300 rounded-xl flex justify-center items-center transition-colors"
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
          className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        >
           <Timer className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
