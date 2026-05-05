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
        setIsActive(false);
        // Using a more subtle notification or just stopping for now as alert can be blocked/annoying in iframes
        console.log(mode === 'study' ? 'Sessão de estudos concluída!' : 'Pausa finalizada!');
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
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        {isOpen && (
          <div className="bg-[#0b1120] text-slate-300 border border-white/10 rounded-[2rem] p-6 shadow-2xl mb-4 w-72 animate-in slide-in-from-bottom-4 duration-300 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6">
               <div className="flex bg-white/[0.02] p-1 rounded-xl border border-white/5">
                 <button 
                    onClick={setStudyMode} 
                    className={`px-4 py-1.5 text-[9px] uppercase font-bold tracking-widest rounded-lg transition-all ${mode === 'study' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   Foco
                 </button>
                 <button 
                    onClick={setBreakMode} 
                    className={`px-4 py-1.5 text-[9px] uppercase font-bold tracking-widest rounded-lg transition-all ${mode === 'break' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   Pausa
                 </button>
               </div>
               <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all">
                  <X className="w-4 h-4" />
               </button>
            </div>
            
            <div className="text-6xl font-mono font-bold text-white tracking-tighter mb-8 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              {formatTime(timeLeft)}
            </div>

            <div className="flex items-center gap-3 w-full">
               <button 
                 onClick={toggleTimer} 
                 className={`flex-1 py-4 rounded-2xl flex justify-center items-center gap-2 font-bold text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 ${isActive ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'}`}
               >
                  {isActive ? <><Square className="w-4 h-4 fill-current"/> Parar</> : <><Play className="w-4 h-4 fill-current"/> Iniciar</>}
               </button>
               <button 
                 onClick={resetTimer}
                 className="w-14 h-14 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl flex justify-center items-center transition-all active:rotate-180"
                 title="Reset"
               >
                  <RefreshCcw className="w-4 h-4" />
               </button>
            </div>
          </div>
        )}
        
        {!isOpen && (
          <button 
            onClick={() => setIsOpen(true)}
            className="group relative bg-indigo-600 hover:bg-indigo-500 text-white w-16 h-16 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
             <div className="absolute inset-0 bg-indigo-400 rounded-2xl animate-ping opacity-20 group-hover:hidden"></div>
             <Timer className="w-7 h-7 relative z-10" />
          </button>
        )}
      </div>
    </div>
  );
}
