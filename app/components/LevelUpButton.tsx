'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { levelUpSkill } from '../actions/skills';

interface LevelUpButtonProps {
  area: string;
  nextLevel: string;
}

export default function LevelUpButton({ area, nextLevel }: LevelUpButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLevelUp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      const result = await levelUpSkill(area);
      if (result.success) {
        console.log(`Leveled up ${area} to ${nextLevel}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLevelUp}
      disabled={isLoading}
      className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20 group cursor-pointer"
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <>
          <Sparkles className="w-3 h-3 group-hover:scale-125 transition-transform" />
          Subir para {nextLevel}
        </>
      )}
    </button>
  );
}
