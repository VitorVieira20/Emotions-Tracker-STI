'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import LogoutButton from '../dashboard/LogoutButton';
import QuizSelectionModal from './QuizSelectionModal';

interface DashboardHeaderProps {
  userName: string;
  userLevel: string;
}

export default function DashboardHeader({ userName, userLevel }: DashboardHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-50">Olá, {userName}</h1>
          <p className="text-slate-400 text-sm mt-1">{userLevel}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Sparkles size={18} />
            Novo Quiz
          </button>
          <LogoutButton />
        </div>
      </header>

      <QuizSelectionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
