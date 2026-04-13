import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';
import { BrainCircuit, Trophy, Target, Clock, Ear, BookOpen, PenTool, MessageSquare, Type, FileText, ChevronRight } from 'lucide-react';
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
          <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-white/5">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-slate-50">Progresso por Tópico</h2>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
                Clica para detalhes <ChevronRight size={10} />
              </span>
            </div>
            <div className="space-y-6 flex-1">
              {skillsBreakdown.map((skill) => (
                <div key={skill.topic} className="group p-1">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-800/50 text-slate-400 group-hover:bg-slate-800 transition-colors">
                        <skill.icon size={18} style={{ color: skill.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">{skill.topic}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Nível {skill.level} • {skill.correctInLevel}/{skill.totalInLevel}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-400">{skill.mastery}% Completo</p>
                  </div>
                  <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                      style={{
                        width: `${skill.mastery}%`,
                        backgroundColor: skill.color
                      }}
                    ></div>
                  </div>
                  {skill.canLevelUp && skill.nextLevel && (
                    <LevelUpButton area={skill.topic} nextLevel={skill.nextLevel} />
                  )}
                </div>
              ))}
              {skillsBreakdown.length === 0 && (
                <p className="text-slate-400 text-center py-8">A carregar dados de progresso...</p>
              )}
            </div>
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
