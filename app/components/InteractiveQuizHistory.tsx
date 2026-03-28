'use client';

import { useState } from 'react';
import { QuizAttempt } from '@/types/QuizAttempt';
import { CheckCircle2, XCircle, Lightbulb, Clock, ChevronsRight, BarChart2, Trophy } from 'lucide-react';

function formatDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
  
    if (date.toDateString() === today.toDateString()) return "Hoje";
    if (date.toDateString() === yesterday.toDateString()) return "Ontem";
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function InteractiveQuizHistory({ attempts }: { attempts: QuizAttempt[] }) {
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);

  return (
    <div className="bg-slate-900 p-6 md:p-8 rounded-2xl shadow-lg border border-white/5">
      <h2 className="text-xl font-bold text-slate-50 mb-6">Histórico de Quizzes</h2>
      <div className="space-y-4">
        {attempts.map((attempt) => (
          <div key={attempt.id} className="p-4 rounded-xl border border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setSelectedAttempt(attempt)}>
            <div className="grid grid-cols-2 md:grid-cols-4 items-center gap-4">
                <div>
                    <p className="text-sm font-semibold text-slate-100">{`Sessão de ${formatDate(attempt.startTime)}`}</p>
                    <p className="text-xs text-slate-400">{attempt.responses.length} questões</p>
                </div>
                <div className="flex items-center gap-2">
                    <Trophy className="text-amber-400" size={18} />
                    <div>
                        <p className="text-sm font-semibold text-slate-100">{`${attempt.score}/${attempt.totalQuestions}`}</p>
                        <p className="text-xs text-slate-400">Pontuação</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <BarChart2 className="text-indigo-400" size={18} />
                    <div>
                        <p className="text-sm font-semibold text-slate-100">{100 - Math.round(attempt.avgFrustration)}%</p>
                        <p className="text-xs text-slate-400">Foco Médio</p>
                    </div>
                </div>
                <div
                    className="flex items-center gap-2 justify-center md:justify-end text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                    Ver Detalhes
                    <ChevronsRight size={18} />
                </div>
            </div>
          </div>
        ))}
        {attempts.length === 0 && (
            <p className="text-slate-400 text-center py-8">Nenhuma atividade recente para mostrar.</p>
        )}
      </div>

      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSelectedAttempt(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-800">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-50">Detalhes do Quiz</h3>
                        <p className="text-sm text-slate-400">Realizado em {formatDate(selectedAttempt.startTime)}</p>
                    </div>
                    <button onClick={() => setSelectedAttempt(null)} className="p-2 rounded-full text-slate-400 hover:bg-slate-800">&times;</button>
                </div>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {selectedAttempt.responses.map((response, idx) => (
                <div key={response.id} className="p-4 rounded-lg border border-slate-800 bg-slate-950/50">
                  <p className="font-semibold text-slate-100 mb-3">{idx + 1}. {response.question.text}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className={`flex items-center gap-2 font-medium ${response.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {response.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      <span>{response.isCorrect ? 'Correto' : 'Incorreto'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <Lightbulb size={16} className={response.hintUsed ? 'text-yellow-400' : 'text-slate-600'}/>
                        <span>{response.hintUsed ? 'Dica usada' : 'Sem dica'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={16}/>
                        <span>{response.timeSpentSeconds}s</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-full bg-slate-700 rounded-full h-2.5">
                            <div className={`h-2.5 rounded-full ${response.frustrationLevel > 50 ? 'bg-rose-500' : 'bg-indigo-400'}`} style={{width: `${response.frustrationLevel}%`}}></div>
                        </div>
                        <span className="font-medium text-xs">{Math.round(response.frustrationLevel)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

