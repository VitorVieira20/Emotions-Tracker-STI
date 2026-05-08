'use client';

import { Skill } from '@/types/Skill';
import LevelUpButton from './LevelUpButton';
import { Ear, BookOpen, PenTool, MessageSquare, Type, FileText, Target, LucideIcon } from 'lucide-react';

const AREA_ICONS: Record<string, LucideIcon> = {
  'Listening': Ear,
  'Reading': BookOpen,
  'Writing': PenTool,
  'Speaking': MessageSquare,
  'Grammar': Type,
  'Vocabulary': FileText,
};

interface AreaCardProps {
  skill: Skill;
  onClick: (skill: Skill) => void;
}

export default function AreaCard({ skill, onClick }: AreaCardProps) {
  const Icon = AREA_ICONS[skill.topic] || Target;

  return (
    <div
      onClick={() => onClick(skill)}
      className="group bg-slate-900/80 border border-white/10 p-5 rounded-2xl transition-all duration-300 hover:bg-white/5 hover:border-white/20 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40 cursor-pointer relative overflow-hidden"
    >
      {/* Background Glow */}
      <div 
        className="absolute -right-8 -top-8 w-24 h-24 blur-[60px] opacity-10 rounded-full" 
        style={{ backgroundColor: skill.color }}
      ></div>

      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div 
            className="p-2.5 rounded-xl bg-slate-800/50 border border-white/5 transition-transform group-hover:scale-110" 
            style={{ color: skill.color }}
          >
            <Icon size={20} />
          </div>
          <span className="font-bold text-slate-100 tracking-tight">{skill.topic}</span>
        </div>
        <div className="px-3 py-1 rounded-lg bg-slate-800 border border-white/5 text-[10px] font-black text-slate-300 shadow-inner">
          NÍVEL {skill.level}
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out relative"
            style={{
              width: `${skill.mastery}%`,
              backgroundColor: skill.color,
              boxShadow: `0 0 15px ${skill.color}44`
            }}
          ></div>
        </div>

        <div className="flex justify-between items-center px-1">
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => (
            <div key={l} className="flex flex-col items-center gap-1">
              <div className={`w-0.5 h-1 rounded-full ${l === skill.level ? 'bg-white' : 'bg-slate-800'}`}></div>
              <span className={`text-[11px] font-black tracking-tighter transition-colors ${l === skill.level ? 'text-white scale-110' : 'text-slate-600'}`}>
                {l}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
        <span className="text-[13px] text-slate-500 font-bold uppercase tracking-wider">
          {skill.correctInLevel} de {skill.totalInLevel} Domímio
        </span>
        <span className="text-[12px] font-black px-2 py-0.5 rounded bg-slate-950 border border-white/5" style={{ color: skill.color }}>
          {skill.mastery}%
        </span>
      </div>

      {skill.canLevelUp && skill.nextLevel && (
        <div 
          className="mt-4 animate-pulse" 
          onClick={(e) => e.stopPropagation()}
        >
          <LevelUpButton area={skill.topic} nextLevel={skill.nextLevel} />
        </div>
      )}
    </div>
  );
}
