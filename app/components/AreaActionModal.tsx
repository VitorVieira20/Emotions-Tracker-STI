'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, BarChart3, X, Ear, BookOpen, PenTool, MessageSquare, Type, FileText, Target, LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skill } from '@/types/Skill';

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

  if (!area) return null;

  const Icon = AREA_ICONS[area.topic] || Target;

  const handleStartTraining = () => {
    router.push(`/quiz/start?area=${area.topic}`);
    onClose();
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="absolute -right-20 -top-20 w-64 h-64 blur-[100px] opacity-20 rounded-full"
              style={{ backgroundColor: area.color }}
            ></div>

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
                onClick={handleStartTraining}
                className="group flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300 text-left"
              >
                <div className="p-3 rounded-xl bg-white/5 text-slate-300 group-hover:text-white transition-colors">
                  <PlayCircle size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">Inicia um Treino Específico</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                    Inicia um novo quiz adaptativo específico deste componente.
                  </p>
                </div>
              </button>

              <button
                onClick={handleAnalyzeHistory}
                className="group flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300 text-left"
              >
                <div className="p-3 rounded-xl bg-white/5 text-slate-300 group-hover:text-white transition-colors">
                  <BarChart3 size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">Analisa o Histórico</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                    Filtra o teu registo de atividade para ver a tua performace neste componente.
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
