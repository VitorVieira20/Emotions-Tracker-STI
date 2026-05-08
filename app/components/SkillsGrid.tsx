'use client';

import { useState } from 'react';
import { ChevronRight, Info } from 'lucide-react';
import { Skill } from '@/types/Skill';
import AreaCard from './AreaCard';
import AreaActionModal from './AreaActionModal';

interface SkillsGridProps {
  skills: Skill[];
}

export default function SkillsGrid({ skills }: SkillsGridProps) {
  const [selectedArea, setSelectedArea] = useState<Skill | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (skill: Skill) => {
    setSelectedArea(skill);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-50">Progresso por Componente</h2>
            <div className="group relative">
              <Info size={14} className="text-slate-500 cursor-help" />
              <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-800 text-[10px] leading-relaxed text-slate-300 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-white/5 shadow-2xl backdrop-blur-md">
                Esta barra mostra o teu domínio do nível atual. Alcança 100% para subir de nível e desbloquear novos desafios.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {skills.map((skill) => (
            <AreaCard
              key={skill.topic}
              skill={skill}
              onClick={handleCardClick}
            />
          ))}
        </div>

        {skills.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500 text-sm font-medium">A carregar métricas de progresso...</p>
          </div>
        )}
      </div>

      <AreaActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        area={selectedArea}
      />
    </>
  );
}
