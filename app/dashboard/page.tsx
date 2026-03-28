import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';
import { BrainCircuit, Trophy, Target, Clock, Sparkles, History, TrendingUp } from 'lucide-react';
import LogoutButton from './LogoutButton';
import { QuizAttempt } from '@/types/QuizAttempt';

const formatEnglishLevel = (level: string | null) => {
  switch (level) {
    case 'A2': return 'Inglês - Básico (A2)';
    case 'B1': return 'Inglês - Intermédio (B1)';
    case 'B2': return 'Inglês - Intermédio/Avançado (B2)';
    case 'C1': return 'Inglês - Avançado (C1)';
    default: return 'Nível não definido';
  }
};

function formatDuration(seconds: number) {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
}

function formatDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
  
    if (date.toDateString() === today.toDateString()) return "Hoje";
    if (date.toDateString() === yesterday.toDateString()) return "Ontem";
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}


export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect('/login');

  const completedAttempts = await prisma.quizAttempt.findMany({
    where: { 
        userId: session.user.id,
        endTime: { not: null }
    },
    orderBy: { startTime: 'desc' },
    include: {
      responses: {
        include: {
          question: true,
        },
      },
    },
  }) as QuizAttempt[];

  const totalQuestionsAnswered = completedAttempts.reduce((sum, a) => sum + (a.totalQuestions || 0), 0);
  const totalCorrect = completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
  const avgScore = totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;
  const hintsUsed = completedAttempts.reduce((sum, a) => sum + (a.totalHintsUsed || 0), 0);
  const totalTimeSeconds = completedAttempts.reduce((sum, a) => {
    if (a.endTime) {
      return sum + (a.endTime.getTime() - a.startTime.getTime()) / 1000;
    }
    return sum;
  }, 0);
  const overallAvgFrustration = completedAttempts.length > 0 
    ? completedAttempts.reduce((sum, a) => sum + (a.avgFrustration || 0), 0) / completedAttempts.length
    : 0;

  const kpis = {
    avgScore: `${avgScore}%`,
    focusLevel: `${100 - Math.round(overallAvgFrustration)}%`,
    hintsUsed: hintsUsed,
    totalTime: formatDuration(Math.round(totalTimeSeconds)),
  };

  const allResponses = completedAttempts.flatMap(a => a.responses);
  const responsesByArea = allResponses.reduce((acc, res) => {
    const area = res.question.area;
    if (!acc[area]) {
      acc[area] = { correct: 0, total: 0 };
    }
    acc[area].total++;
    if (res.isCorrect) {
      acc[area].correct++;
    }
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  const skillsBreakdown = Object.entries(responsesByArea).map(([topic, data]) => {
    const mastery = Math.round((data.correct / data.total) * 100);
    let color = 'bg-rose-500';
    if (mastery >= 80) color = 'bg-emerald-500';
    else if (mastery >= 50) color = 'bg-amber-500';
    return { topic, mastery, color };
  });

  const recentQuizzes = completedAttempts.slice(0, 5).map(attempt => ({
    title: `Sessão em ${attempt.responses[0]?.question.area || 'Tópico Misto'}`,
    score: `${attempt.score}/${attempt.totalQuestions}`,
    date: formatDate(attempt.startTime),
    emotion: (attempt.avgFrustration || 0) < 50 ? 'Focado' : 'Frustrado',
    hintHelp: (attempt.totalHintsUsed || 0) > 0,
  }));


  const userName = user.name || user.username;
  const userLevel = formatEnglishLevel(user.englishLevel);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-4 md:p-8">

      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Olá, {userName} 👋</h1>
          <p className="text-slate-400 text-sm mt-1">{userLevel}</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link href="/quiz" className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold transition-all shadow-lg shadow-indigo-500/20 w-full md:w-auto justify-center">
            <Sparkles size={18} />
            Continuar a Aprender
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">

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
              {skillsBreakdown.length > 0 ? skillsBreakdown.map((skill, idx) => (
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
                </div>
              )) : <p className="text-slate-400 text-sm text-center py-8">Sem dados de tópicos para mostrar. Complete um quiz!</p>}
            </div>
          </div>

          <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border border-white/5 shadow-lg flex flex-col">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <History className="text-slate-400" size={20} />
              <h2 className="text-lg font-bold">Atividade Recente</h2>
            </div>

            <div className="flex flex-col gap-5 overflow-y-auto pr-2">
              {recentQuizzes.length > 0 ? recentQuizzes.map((quiz, i) => (
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
              )) : <p className="text-slate-400 text-sm text-center py-8">Nenhuma atividade recente.</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}