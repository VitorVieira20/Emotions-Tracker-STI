'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  BookOpen, 
  X, 
  Brain, 
  ChevronRight, 
  Type, 
  Ear, 
  FileText, 
  MessageSquare, 
  PenTool 
} from 'lucide-react';
import { startAdaptiveQuiz } from '../actions/adaptiveEngine';

const AREAS = [
  { id: 'Grammar', label: 'Grammar', icon: Type, color: 'text-amber-400' },
  { id: 'Vocabulary', label: 'Vocabulary', icon: BookOpen, color: 'text-sky-400' },
  { id: 'Reading', label: 'Reading', icon: FileText, color: 'text-emerald-400' },
  { id: 'Listening', label: 'Listening', icon: Ear, color: 'text-indigo-400' },
  { id: 'Speaking', label: 'Speaking', icon: MessageSquare, color: 'text-rose-400' },
  { id: 'Writing', label: 'Writing', icon: PenTool, color: 'text-purple-400' },
];

interface QuizSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuizSelectionModal({ isOpen, onClose }: QuizSelectionModalProps) {
  const router = useRouter();
  const [view, setView] = useState<'main' | 'areas'>('main');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleStartQuiz = async (area?: string) => {
    setIsLoading(true);
    try {
      const result = await startAdaptiveQuiz(area);
      if (result && !result.error && result.attemptId) {
        router.push(`/quiz/${result.attemptId}`);
      } else {
        console.error("Failed to start quiz:", result?.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 h-full">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
        onClick={onClose}
      />
      
      <div className="relative bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-50">Escolha o seu treino</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {view === 'main' ? (
            <div className="space-y-4">
              <button
                onClick={() => handleStartQuiz()}
                disabled={isLoading}
                className="w-full group flex items-start gap-4 p-5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-2xl transition-all text-left cursor-pointer"
              >
                <div className="p-3 bg-indigo-600 rounded-xl text-white">
                  <Sparkles size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-50 text-lg">Modo Adaptativo</h3>
                  <p className="text-slate-400 text-sm mt-1">A IA escolhe as questões com base no seu perfil e progresso.</p>
                </div>
                <ChevronRight className="self-center text-slate-500 group-hover:text-slate-300 transition-colors" />
              </button>

              <button
                onClick={() => setView('areas')}
                disabled={isLoading}
                className="w-full group flex items-start gap-4 p-5 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-2xl transition-all text-left cursor-pointer"
              >
                <div className="p-3 bg-slate-700 rounded-xl text-slate-300">
                  <Brain size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-50 text-lg">Área Específica</h3>
                  <p className="text-slate-400 text-sm mt-1">Foque o seu estudo num tópico específico para dominar a matéria.</p>
                </div>
                <ChevronRight className="self-center text-slate-500 group-hover:text-slate-300 transition-colors" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {AREAS.map((area) => (
                <button
                  key={area.id}
                  onClick={() => handleStartQuiz(area.id)}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-2xl transition-all group cursor-pointer"
                >
                  <area.icon className={`${area.color} group-hover:scale-110 transition-transform`} size={28} />
                  <span className="text-sm font-medium text-slate-300">{area.label}</span>
                </button>
              ))}
              <button
                onClick={() => setView('main')}
                className="col-span-2 mt-4 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Voltar para opções gerais
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-indigo-400 font-bold animate-pulse">A preparar a sessão...</p>
          </div>
        )}
      </div>
    </div>
  );
}
