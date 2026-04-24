'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QuizAttempt } from '@/types/QuizAttempt';
import {
  CheckCircle2, XCircle, Lightbulb, Clock, ChevronsRight,
  Brain, Calendar, Info, X
} from 'lucide-react';
import {
  Ear, BookOpen, PenTool, MessageSquare, Type, FileText
} from 'lucide-react';

const AREA_CONFIG: Record<string, { color: string, icon: any, label: string }> = {
  'Listening': { color: '#8B5CF6', icon: Ear, label: 'Listening' },
  'Reading': { color: '#EF4444', icon: BookOpen, label: 'Reading' },
  'Writing': { color: '#3B82F6', icon: PenTool, label: 'Writing' },
  'Speaking': { color: '#F59E0B', icon: MessageSquare, label: 'Speaking' },
  'Grammar': { color: '#10B981', icon: Type, label: 'Grammar' },
  'Vocabulary': { color: '#6366F1', icon: FileText, label: 'Vocabulary' },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function InteractiveQuizHistory({ attempts }: { attempts: QuizAttempt[] }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedAttempt) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSelectedAttempt(null);
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [selectedAttempt]);

  const attemptsByDate = useMemo(() => {
    const groups: Record<string, QuizAttempt[]> = {};
    attempts.forEach(a => {
      const dateKey = new Date(a.startTime).toISOString().split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(a);
    });
    return groups;
  }, [attempts]);

  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();

    const startDate = new Date();
    startDate.setDate(today.getDate() - 24 * 7);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    startDate.setHours(0, 0, 0, 0);

    const totalDays = 24 * 7 + today.getDay() + (7 - today.getDay() - 1);

    for (let i = 0; i <= totalDays; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const dateKey = current.toISOString().split('T')[0];
      days.push({
        date: dateKey,
        count: attemptsByDate[dateKey]?.length || 0,
        isToday: dateKey === today.toISOString().split('T')[0],
        month: current.getMonth(),
        dayOfWeek: current.getDay()
      });
    }
    return days;
  }, [attemptsByDate]);

  const totalCols = Math.ceil(heatmapDays.length / 7);

  const monthLabels = useMemo(() => {
    const labels: { name: string; colIndex: number }[] = [];
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    for (let colIndex = 0; colIndex < totalCols; colIndex++) {
      const firstDayIdx = colIndex * 7;
      const currentMonth = heatmapDays[firstDayIdx].month;

      if (colIndex === 0) {
        labels.push({ name: monthNames[currentMonth], colIndex });
      } else {
        const prevMonth = heatmapDays[firstDayIdx - 7].month;
        if (currentMonth !== prevMonth) {
          labels.push({ name: monthNames[currentMonth], colIndex });
        }
      }
    }
    return labels;
  }, [heatmapDays, totalCols]);

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-slate-800/30';
    if (count <= 2) return 'bg-indigo-900/40';
    if (count <= 5) return 'bg-indigo-700/60';
    return 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]';
  };

  const selectedAttempts = selectedDate ? attemptsByDate[selectedDate] || [] : [];

  return (
    <div className="bg-slate-900/50 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={18} className="text-indigo-400" />
          <h2 className="text-xl font-bold text-slate-50 font-display">Histórico de Atividade</h2>
        </div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-6">Registo Biométrico de Aprendizagem</p>

        <div className="flex flex-col gap-2 overflow-x-auto pb-4 custom-scrollbar">

          <div className="grid grid-flow-col grid-rows-7 gap-y-1.5 gap-x-0 min-w-max">
            {heatmapDays.map((day) => (
              <div
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className={`w-3.5 h-3.5 rounded-[3px] transition-all cursor-pointer relative group ${getIntensityClass(day.count)} ${selectedDate === day.date ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-slate-950 scale-110 z-10' : 'hover:ring-1 hover:ring-white/20'}`}
              >
                <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/10">
                  {day.count} quizzes em {new Date(day.date).toLocaleDateString('pt-PT')}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end items-center mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span>Menos</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-[2px] bg-slate-800/30"></div>
                <div className="w-3 h-3 rounded-[2px] bg-indigo-900/40"></div>
                <div className="w-3 h-3 rounded-[2px] bg-indigo-700/60"></div>
                <div className="w-3 h-3 rounded-[2px] bg-indigo-500"></div>
              </div>
              <span>Mais</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            Atividade em {selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) : 'Selecionar dia'}
          </h3>
          <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full uppercase">
            {selectedAttempts.length} sessões
          </span>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {selectedAttempts.length > 0 ? (
            selectedAttempts.map((attempt, idx) => {
              const area = attempt.selectedArea;
              const config = area ? AREA_CONFIG[area] : null;
              const focusLevel = 100 - Math.round(attempt.avgFrustration);

              return (
                <div
                  key={attempt.id}
                  onClick={() => setSelectedAttempt(attempt)}
                  className="group relative pl-6 border-l-2 border-slate-800 hover:border-indigo-500 transition-all cursor-pointer pb-2"
                >
                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-slate-800 group-hover:bg-indigo-500 transition-colors"></div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-2xl border border-white/5 group-hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 shadow-inner" style={{ color: config?.color || '#6366f1' }}>
                        {config ? <config.icon size={18} /> : <Brain size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-100">{area || 'Quiz Adaptativo'}</p>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${area ? 'bg-slate-800 text-slate-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                            {area ? 'Focado' : 'Adaptativo'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{formatTime(new Date(attempt.startTime))}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-slate-500 font-black uppercase">Estabilidade</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${focusLevel}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-slate-300">{focusLevel}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end min-w-[60px]">
                        <span className="text-[9px] text-slate-500 font-black uppercase">Score</span>
                        <p className="text-sm font-black text-white">{attempt.score}<span className="text-slate-500">/{attempt.totalQuestions}</span></p>
                      </div>
                      <ChevronsRight size={18} className="text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
              <Info size={32} className="text-slate-700 mb-2" />
              <p className="text-slate-500 text-sm font-medium">Nenhuma atividade registada neste dia.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal via Portal */}
      {selectedAttempt && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setSelectedAttempt(null)}
          />
          
          {/* Modal Container */}
          <div 
            className="relative bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Glow */}
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <div className="p-6 border-b border-white/5 relative z-10 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-slate-950 border border-white/5" style={{ color: (selectedAttempt.selectedArea ? AREA_CONFIG[selectedAttempt.selectedArea]?.color : '#6366f1') }}>
                  {(() => {
                    const Icon = selectedAttempt.selectedArea ? AREA_CONFIG[selectedAttempt.selectedArea]?.icon : Brain;
                    return <Icon size={24} />;
                  })()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-50">{selectedAttempt.selectedArea || 'Análise Adaptativa'}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{formatDate(new Date(selectedAttempt.startTime))} • {formatTime(new Date(selectedAttempt.startTime))}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAttempt(null)} 
                className="p-2 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                title="Fechar (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto relative z-10 custom-scrollbar">
              {selectedAttempt.responses.map((response, idx) => (
                <div key={response.id} className="p-5 rounded-2xl border border-white/5 bg-slate-950/40 backdrop-blur-sm group hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <p className="font-bold text-slate-100 leading-relaxed">{idx + 1}. {response.question.text}</p>
                    <div className={`flex-shrink-0 p-1 rounded-lg ${response.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {response.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm mb-6">
                    {!response.isCorrect && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-400">
                        <XCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <p className="text-xs font-medium"><span className="opacity-60">A tua resposta:</span> {response.userAnswer || 'Não respondida'}</p>
                      </div>
                    )}
                    <div className={`flex items-start gap-3 p-3 rounded-xl ${response.isCorrect ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-500/5 border-emerald-500/5'} border text-emerald-400`}>
                      <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-medium"><span className="opacity-60">{response.isCorrect ? 'Resposta Correta' : 'A resposta certa era'}:</span> {response.isCorrect ? response.userAnswer : response.question.options[response.question.correctOption]}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Dica</span>
                      <div className="flex items-center gap-1.5">
                        <Lightbulb size={12} className={response.hintUsed ? 'text-yellow-400' : 'text-slate-600'} />
                        <span className="text-[10px] font-bold text-slate-400">{response.hintUsed ? 'Utilizada' : 'Ignorada'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Tempo</span>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold">{response.timeSpentSeconds}s</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Frustração</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 rounded-full h-1 overflow-hidden">
                          <div className={`h-full rounded-full ${response.frustrationLevel > 40 ? 'bg-rose-500' : 'bg-indigo-400'}`} style={{ width: `${response.frustrationLevel}%` }}></div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{Math.round(response.frustrationLevel)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
