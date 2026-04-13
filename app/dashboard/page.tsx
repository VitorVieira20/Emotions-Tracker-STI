import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';
import { BrainCircuit, Trophy, Target, Clock } from 'lucide-react';
import { QuizAttempt } from '@/types/QuizAttempt';
import InteractiveQuizHistory from '../components/InteractiveQuizHistory';
import DashboardHeader from '../components/DashboardHeader';

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
  
    // KPIs Calculation
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
  
    const allResponses = completedAttempts.flatMap(a => a.responses);
    const responsesByArea = allResponses.reduce((acc, res) => {
      const area = res.question.area;
      if (!acc[area]) {
        acc[area] = { correct: 0, total: 0 };
      }
      acc[area].total++;
      if (res.isCorrect) acc[area].correct++;
      return acc;
    }, {} as Record<string, { correct: number; total: number }>);
  
    const skillsBreakdown = Object.entries(responsesByArea).map(([topic, data]) => {
      const mastery = Math.round((data.correct / data.total) * 100);
      let color = 'bg-rose-500';
      if (mastery >= 80) color = 'bg-emerald-500';
      else if (mastery >= 50) color = 'bg-amber-500';
      return { topic, mastery, color };
    }).sort((a, b) => b.mastery - a.mastery);
  
    const userName = user.name || user.username;
    const userLevel = formatEnglishLevel(user.englishLevel);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-4 sm:p-6 md:p-8">
            <main className="max-w-7xl mx-auto space-y-8">
                <DashboardHeader userName={userName} userLevel={userLevel} />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard icon={Trophy} title="Pontuação Média" value={kpis.avgScore} color="amber" />
                    <KpiCard icon={BrainCircuit} title="Nível de Foco (IA)" value={kpis.focusLevel} color="indigo" />
                    <KpiCard icon={Target} title="Dicas Utilizadas" value={kpis.hintsUsed.toString()} color="sky" />
                    <KpiCard icon={Clock} title="Tempo de Estudo" value={kpis.totalTime} color="emerald" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-slate-900 p-6 rounded-2xl shadow-lg border border-white/5">
                        <h2 className="text-xl font-bold text-slate-50 mb-6">Domínio por Tópico</h2>
                        <div className="space-y-5">
                            {skillsBreakdown.map((skill) => (
                                <div key={skill.topic}>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-medium text-slate-300">{skill.topic}</p>
                                        <p className="text-sm font-bold text-slate-50">{skill.mastery}%</p>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-2">
                                        <div className={`h-2 rounded-full ${skill.color}`} style={{ width: `${skill.mastery}%` }}></div>
                                    </div>
                                </div>
                            ))}
                             {skillsBreakdown.length === 0 && (
                                <p className="text-slate-400 text-center py-8">Complete um quiz para ver a análise de tópicos.</p>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
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