'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Target, Home, Clock, Brain, Lightbulb, RefreshCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import CountUp from './CountUp';

export default function SummaryView({ stats, onRestart, area }: { 
  stats: { score: number, totalQuestions: number, totalHints: number, avgFrustration: number, totalTimeSpent: number }, 
  onRestart: () => void,
  area?: string
}) {
  const percentage = Math.round((stats.score / stats.totalQuestions) * 100);
  const focusLevel = Math.round(100 - stats.avgFrustration);
  
  useEffect(() => {
    if (percentage >= 70) {
      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100, colors: ['#6366f1', '#8b5cf6', '#06b6d4'] };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
      
      return () => clearInterval(interval);
    }
  }, [percentage]);

  const getHeaderMessage = () => {
    if (percentage >= 90) return "Incrível! Domínio Total!";
    if (percentage >= 70) return "Excelente Trabalho!";
    return "Bom esforço! Continua a praticar!";
  };

  const getEmotionalInsight = () => {
    if (stats.avgFrustration < 30) return "Estado de Fluxo: Demonstrou um foco calmo e constante.";
    if (stats.avgFrustration > 60 && percentage > 70) return "Resiliência: Superou momentos de frustração com grande sucesso!";
    return "Foco Equilibrado: Manteve a atenção durante todo o desafio.";
  };

  return (
    <div className="flex flex-col items-center py-6 md:py-10 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
      <h2 className="text-2xl md:text-3xl font-black text-white mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
        {getHeaderMessage()}
      </h2>

      <div className="relative w-56 h-56 mb-10 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-3xl animate-pulse"></div>
        
        <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-slate-800/50" />
          <circle 
            cx="112" cy="112" r="100" stroke="url(#scoreGradient)" strokeWidth="14" fill="transparent" 
            strokeDasharray={628.3}
            strokeDashoffset={628.3 - (628.3 * percentage) / 100}
            className="transition-all duration-1500 ease-out"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-6xl font-black text-white tracking-tighter"><CountUp end={percentage} duration={1500} />%</span>
          <span className="text-indigo-400 font-bold uppercase tracking-widest text-xs mt-1">Nível de Mestria</span>
        </div>
      </div>

      <div className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 mb-8 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
          <Brain size={160} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Brain size={20} />
            </div>
            <h3 className="text-indigo-300 font-black text-sm uppercase tracking-[0.2em]">Análise Biofeedback</h3>
          </div>
          <p className="text-slate-100 font-semibold text-xl leading-snug mb-6">{getEmotionalInsight()}</p>
          
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/5">
             <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estabilidade</span>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${focusLevel}%` }}></div>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{focusLevel}%</span>
                </div>
             </div>
             <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Foco Cognitivo</span>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 transition-all duration-1000" style={{ width: `${100 - stats.avgFrustration}%` }}></div>
                  </div>
                  <span className="text-sm font-bold text-sky-400">{Math.round(100 - stats.avgFrustration)}%</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full mb-10">
        {[
          { icon: <Target className="text-rose-400" size={24} />, label: "Precisão", value: `${percentage}%` },
          { icon: <Clock className="text-amber-400" size={24} />, label: "Tempo Total", value: `${Math.floor(stats.totalTimeSpent / 60)}m ${stats.totalTimeSpent % 60}s` },
          { icon: <Lightbulb className="text-yellow-400" size={24} />, label: "Dicas Usadas", value: stats.totalHints },
          { icon: <Brain className="text-purple-400" size={24} />, label: "Estabilidade", value: `${focusLevel}%` }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/40 border border-white/5 backdrop-blur-sm p-5 rounded-3xl flex flex-col items-center hover:bg-slate-800/60 transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-slate-800/50 mb-3 group-hover:scale-110 transition-transform duration-300">
              {stat.icon}
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">{stat.label}</span>
            <span className="text-xl font-bold text-white">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row w-full gap-4">
        <button 
          onClick={onRestart}
          className="flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-pulse text-white font-black hover:scale-[1.05] transition-all cursor-pointer shadow-xl shadow-indigo-500/25 active:scale-95"
        >
          <RefreshCcw size={20} />
          PRATICAR NOVAMENTE
        </button>
        <Link 
          href="/dashboard" 
          className="flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl text-white font-bold hover:bg-white/5 transition-all border border-white/10 hover:scale-[1.05] active:scale-95 bg-slate-900"
        >
          <Home size={20} />
          DASHBOARD
        </Link>
      </div>
    </div>
  );
}