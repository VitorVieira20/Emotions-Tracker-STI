'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, BarChart3, X, Ear, BookOpen, PenTool, MessageSquare, Type, FileText, Target, LucideIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skill } from '@/types/Skill';
import { startAdaptiveQuiz } from '../actions/adaptiveEngine';

const AREA_ICONS: Record<string, LucideIcon> = {
  'Listening': Ear,
  'Reading': BookOpen,
  'Writing': PenTool,
  'Speaking': MessageSquare,
  'Grammar': Type,
  'Vocabulary': FileText,
};

interface AreaActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  area: Skill | null;
}

export default function AreaActionModal({ isOpen, onClose, area }: AreaActionModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!mounted || !area) return null;

  const Icon = AREA_ICONS[area.topic] || Target;

  const handleStartQuiz = async () => {
    setIsLoading(true);
    
    try {
      const result = await startAdaptiveQuiz(area.topic);
      
      if (result && !result.error && result.attemptId) {
        router.push(`/quiz/${result.attemptId}`);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleAnalyzeHistory = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('filter', area.topic);
    window.history.pushState({}, '', url);
    window.dispatchEvent(new CustomEvent('filterChanged', { detail: area.topic }));

    const historySection = document.getElementById('activity-history');
    if (historySection) {
      historySection.scrollIntoView({ behavior: 'smooth' });
    }
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl shadow-indigo-500/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow */}
            <div 
              className="absolute -right-20 -top-20 w-64 h-64 blur-[100px] opacity-20 rounded-full pointer-events-none"
              style={{ backgroundColor: area.color }}
            ></div>

            <div className="p-8">
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div 
                    className="p-4 rounded-2xl bg-white/5 border border-white/10"
                    style={{ color: area.color }}
                  >
                    <Icon size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{area.topic}</h2>
                    <p className="text-slate-400 font-medium">Escolhe o que fazer a seguir</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 relative z-10">
                <button
                  onClick={handleStartQuiz}
                  disabled={isLoading}
                  className="group flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-3 rounded-xl bg-white/5 text-slate-300 group-hover:text-white transition-colors">
                    {isLoading ? <Loader2 size={28} className="animate-spin" /> : <PlayCircle size={28} />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {isLoading ? 'A Prepara o Quiz...' : 'Iniciar Quiz Específico'}
                    </h3>
                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                      Inicia um novo quiz adaptativo específico desta componente.
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleAnalyzeHistory}
                  disabled={isLoading}
                  className="group flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-3 rounded-xl bg-white/5 text-slate-300 group-hover:text-white transition-colors">
                    <BarChart3 size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Analisa o Histórico</h3>
                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                      Filtra o teu registo de atividade para ver a tua performance neste componente.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
