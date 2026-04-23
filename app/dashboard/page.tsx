import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';
import { BrainCircuit, Trophy, Target, Clock, Ear, BookOpen, PenTool, MessageSquare, Type, FileText, ChevronRight, Info } from 'lucide-react';
import { QuizAttempt } from '@/types/QuizAttempt';
import InteractiveQuizHistory from '../components/InteractiveQuizHistory';
import DashboardHeader from '../components/DashboardHeader';
import LevelUpButton from '../components/LevelUpButton';

const AREA_CONFIG: Record<string, { color: string, icon: any }> = {
  'Listening': { color: '#8B5CF6', icon: Ear },
  'Reading': { color: '#EF4444', icon: BookOpen },
  'Writing': { color: '#3B82F6', icon: PenTool },
  'Speaking': { color: '#F59E0B', icon: MessageSquare },
  'Grammar': { color: '#10B981', icon: Type },
  'Vocabulary': { color: '#6366F1', icon: FileText },
};

const formatEnglishLevel = (level: string | null) => {
  switch (level) {
    case 'A1': return 'Iniciante (A1)';
    case 'A2': return 'Básico (A2)';
    case 'B1': return 'Intermédio (B1)';
    case 'B2': return 'Utilizador Independente (B2)';
    case 'C1': return 'Avançado (C1)';
    case 'C2': return 'Proficiente (C2)';
    default: return 'Nível não definido';
  }
};

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { skillLevels: true }
  });
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
    totalTime: formatDuration(totalTimeSeconds),
  };

  const areas = ['Listening', 'Reading', 'Writing', 'Speaking', 'Grammar', 'Vocabulary'];

  const skillsBreakdown = await Promise.all(areas.map(async (areaName) => {
    const skillLevelObj = user.skillLevels.find(sl => sl.area === areaName);
    const areaLevel = skillLevelObj?.level || user.englishLevel || 'A1';

    const totalInLevel = await prisma.question.count({
      where: { area: areaName, cefrLevel: areaLevel }
    });

    const correctInLevel = await prisma.question.count({
      where: {
        area: areaName,
        cefrLevel: areaLevel,
        responses: {
          some: {
            isCorrect: true,
            attempt: { userId: session.user.id }
          }
        }
      }
    });

    const mastery = totalInLevel > 0 ? Math.round((correctInLevel / totalInLevel) * 100) : 0;

    const nextLevelMap: Record<string, string> = {
      'A1': 'A2', 'A2': 'B1', 'B1': 'B2', 'B2': 'C1', 'C1': 'C2'
    };
    const nextLevel = nextLevelMap[areaLevel];
    const canLevelUp = mastery === 100 && !!nextLevel;

    const config = AREA_CONFIG[areaName] || { color: '#94a3b8', icon: Target };

    return {
      topic: areaName,
      level: areaLevel,
      mastery,
      canLevelUp,
      nextLevel,
      color: config.color,
      icon: config.icon,
      totalInLevel,
      correctInLevel
    };
  }));

  const userName = user.name || user.username;
  const userLevelFormatted = formatEnglishLevel(user.englishLevel);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-4 sm:p-6 md:p-8">
      <main className="max-w-7xl mx-auto space-y-8">
        <DashboardHeader userName={userName} userLevel={userLevelFormatted} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard icon={Trophy} title="Pontuação Média" value={kpis.avgScore} color="amber" />
          <KpiCard icon={BrainCircuit} title="Nível de Foco (IA)" value={kpis.focusLevel} color="indigo" />
          <KpiCard icon={Target} title="Dicas Utilizadas" value={kpis.hintsUsed.toString()} color="sky" />
          <KpiCard icon={Clock} title="Tempo de Estudo" value={kpis.totalTime} color="emerald" />
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-50">Progresso por Tópico</h2>
                <div className="group relative">
                  <Info size={14} className="text-slate-500 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-800 text-[10px] leading-relaxed text-slate-300 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-white/5 shadow-2xl backdrop-blur-md">
                    Esta barra mostra o teu domínio do nível atual. Chega aos 100% para subir de nível e desbloquear novos desafios.
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-1">
                Análise Detalhada <ChevronRight size={10} />
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {skillsBreakdown.map((skill) => (
                <div key={skill.topic} className="group bg-slate-900/80 border border-white/10 p-5 rounded-2xl transition-all duration-300 hover:border-white/20 hover:bg-slate-900 hover:shadow-2xl hover:shadow-black/40 relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-24 h-24 blur-[60px] opacity-10 rounded-full" style={{ backgroundColor: skill.color }}></div>

                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-800/50 border border-white/5 transition-transform group-hover:scale-110" style={{ color: skill.color }}>
                        <skill.icon size={20} />
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
                      {skill.correctInLevel} de {skill.totalInLevel} Domínio
                    </span>
                    <span className="text-[12px] font-black px-2 py-0.5 rounded bg-slate-950 border border-white/5" style={{ color: skill.color }}>
                      {skill.mastery}%
                    </span>
                  </div>

                  {skill.canLevelUp && skill.nextLevel && (
                    <div className="mt-4 animate-pulse">
                      <LevelUpButton area={skill.topic} nextLevel={skill.nextLevel} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {skillsBreakdown.length === 0 && (
              <div className="text-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500 text-sm font-medium">A carregar métricas de progresso...</p>
              </div>
            )}
          </div>

          <div>
            <InteractiveQuizHistory attempts={completedAttempts} />
          </div>
        </div>
      </main>
    </div>
  );
}

function KpiCard({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: string, color: string }) {
  const colors = {
    amber: 'text-amber-400',
    indigo: 'text-indigo-400',
    sky: 'text-sky-400',
    emerald: 'text-emerald-400',
  }
  return (
    <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-white/5">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <Icon className={`${colors[color as keyof typeof colors] || 'text-slate-400'}`} size={22} />
      </div>
      <p className="text-3xl font-bold text-slate-50">{value}</p>
    </div>
  );
}
