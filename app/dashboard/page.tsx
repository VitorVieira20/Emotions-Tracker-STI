import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';
import { BrainCircuit, Trophy, Target, Clock, ChevronLeft, Sparkles, History, TrendingUp } from 'lucide-react';

const formatEnglishLevel = (level: string | null) => {
  switch (level) {
    case 'A2': return 'Inglês - Básico (A2)';
    case 'B1': return 'Inglês - Intermédio (B1)';
    case 'B2': return 'Inglês - Intermédio/Avançado (B2)';
    case 'C1': return 'Inglês - Avançado (C1)';
    default: return 'Nível não definido';
  }
};

const SKILLS_BREAKDOWN = [
  { topic: "Mixed Conditionals", mastery: 90, color: "bg-emerald-500" },
  { topic: "Negative Inversion", mastery: 45, color: "bg-rose-500" },
  { topic: "Passive Voice", mastery: 75, color: "bg-amber-500" },
  { topic: "Modals of Deduction", mastery: 100, color: "bg-emerald-500" },
];

const RECENT_QUIZZES = [
  { title: "Gramática: Tempos Verbais", score: "9/10", date: "Hoje", emotion: "Focado", hintHelp: true },
  { title: "Vocabulário: Phrasal Verbs", score: "6/10", date: "Ontem", emotion: "Frustrado", hintHelp: false },
  { title: "Leitura: Artigo Científico", score: "8/10", date: "15 Março", emotion: "Focado", hintHelp: false },
];

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect('/login');

  const userName = user.name || user.username;
  const userLevel = formatEnglishLevel(user.englishLevel);

  const kpis = {
    avgScore: "82%",
    focusLevel: "88%",
    hintsUsed: 14,
    totalTime: "3h 45m"
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-4 md:p-8">
      
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-3 text-sm font-medium">
            <ChevronLeft size={16} /> Voltar ao Início
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Olá, {userName} 👋</h1>
          <p className="text-slate-400 text-sm mt-1">{userLevel}</p>
        </div>
        
        <Link href="/quiz" className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold transition-all shadow-lg shadow-indigo-500/20 w-full md:w-auto justify-center">
          <Sparkles size={18} />
          Continuar a Aprender
        </Link>
      </header>

      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Pontuação Média</h3>
              <Trophy className="text-amber-400" size={20} />
            </div>
            <p className="text-3xl font-bold">{kpis.avgScore}</p>
          </div>
          
          <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start mb-2 relative z-10">
              <h3 className="text-slate-400 text-sm font-medium">Nível de Foco (IA)</h3>
              <BrainCircuit className="text-indigo-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-indigo-400 relative z-10">{kpis.focusLevel}</p>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Dicas Utilizadas</h3>
              <Target className="text-sky-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-sky-400">{kpis.hintsUsed}</p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Tempo de Estudo</h3>
              <Clock className="text-emerald-500" size={20} />
            </div>
            <p className="text-3xl font-bold">{kpis.totalTime}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          <div className="lg:col-span-2 bg-slate-900 p-6 md:p-8 rounded-2xl border border-white/5 shadow-lg flex flex-col">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <TrendingUp className="text-slate-400" size={20} />
              <h2 className="text-lg font-bold">O teu Domínio por Tópico</h2>
            </div>
            
            <div className="space-y-6 mt-2">
              {SKILLS_BREAKDOWN.map((skill, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-300">{skill.topic}</span>
                    <span className="font-bold text-white">{skill.mastery}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${skill.color} transition-all duration-1000 ease-out`} 
                      style={{ width: `${skill.mastery}%` }}
                    ></div>
                  </div>
                  {skill.mastery < 50 && (
                    <p className="text-xs text-rose-400 mt-1">Recomendamos rever este tópico. O sistema detetou frustração recorrente aqui.</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border border-white/5 shadow-lg flex flex-col">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <History className="text-slate-400" size={20} />
              <h2 className="text-lg font-bold">Atividade Recente</h2>
            </div>
            
            <div className="flex flex-col gap-5 overflow-y-auto pr-2">
              {RECENT_QUIZZES.map((quiz, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm leading-tight text-slate-200">{quiz.title}</h4>
                    <span className="text-xs font-bold bg-slate-950 px-2 py-1 rounded text-slate-300">{quiz.score}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs mt-2">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      quiz.emotion === 'Focado' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {quiz.emotion}
                    </span>
                    {quiz.hintHelp && (
                      <span className="text-sky-400 flex items-center gap-1">
                        <Sparkles size={10} /> Dicas ajudaram
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}