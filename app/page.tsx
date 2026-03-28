'use client';

import Link from 'next/link';
import AuthButtons from './components/AuthButtons';
import { ChevronRight, BrainCircuit, ShieldCheck, Lightbulb, TestTube2, WholeWord, Target } from 'lucide-react';

export default function LandingPage() {
  return (
    <>
      <style jsx global>{`
        @keyframes pulse-gradient {
          0%, 100% {
            background-size: 200% 200%;
            background-position: 50% 0%;
          }
          50% {
            background-size: 200% 200%;
            background-position: 50% 100%;
          }
        }
        @keyframes shine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div className="min-h-screen w-full bg-slate-950 text-slate-50 font-sans flex flex-col items-center py-12 px-4 sm:px-6 relative overflow-hidden">

        {/* Animated Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-800/[0.2] mask-[linear-gradient(to_bottom,white_10%,transparent_100%)]"></div>
        <div 
          className="absolute inset-0 -z-10 h-full w-full bg-slate-950"
          style={{
            backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(55, 65, 81, 0.4), rgba(255, 255, 255, 0))',
            animation: 'pulse-gradient 8s ease-in-out infinite',
          }}
        ></div>

        <header className="absolute top-0 left-0 w-full p-4 sm:p-6 flex justify-between items-center z-20">
          <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <TestTube2 size={24} className="text-indigo-400"/>
            <span className="hidden sm:inline">Affective Learning</span>
          </div>
          <div className="flex items-center gap-4">
            <AuthButtons />
          </div>
        </header>

        <main className="text-center z-10 flex flex-col items-center pt-28 sm:pt-32">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-slate-50 via-slate-200 to-slate-400 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            Affective Learning Engine
            <span 
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/50 to-transparent bg-clip-text"
              style={{ animation: 'shine 5s linear infinite' }}
            ></span>
          </h1>
          <p className="max-w-3xl text-slate-300 text-base sm:text-lg md:text-xl mb-10 animate-in fade-in slide-in-from-bottom-5 duration-900">
            Uma plataforma de investigação académica que analisa microexpressões para adaptar a experiência de aprendizagem em tempo real, respondendo ao seu estado emocional para melhorar o foco e a retenção.
          </p>
          <Link 
            href="/quiz" 
            className="flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white font-bold transition-all duration-300 shadow-lg shadow-indigo-500/30 transform hover:scale-105 animate-in fade-in zoom-in"
          >
            Iniciar Experiência de Quiz
            <ChevronRight size={20} />
          </Link>
        </main>

        <section className="w-full max-w-5xl mx-auto mt-20 sm:mt-24 md:mt-32 z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">Como Funciona?</h2>
          <p className="text-center text-slate-400 mb-8 md:mb-12 max-w-2xl mx-auto">
            O nosso sistema segue um ciclo de três passos para criar uma experiência de aprendizagem personalizada e reativa, focada na privacidade.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center">

            <div className="flex flex-col items-center p-6 bg-slate-900/50 border border-slate-800 rounded-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 border border-indigo-400/30">
                <Target size={32} className="text-indigo-400"/>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">1. Calibração da Baseline</h3>
              <p className="text-slate-400 text-sm">No início, o sistema regista o seu estado neutro para criar uma referência pessoal e precisa.</p>
            </div>

            <div className="flex flex-col items-center p-6 bg-slate-900/50 border border-slate-800 rounded-2xl animate-in fade-in slide-in-from-bottom-10 duration-900">
              <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center mb-4 border border-sky-400/30">
                <BrainCircuit size={32} className="text-sky-400"/>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">2. Análise em Tempo Real</h3>
              <p className="text-slate-400 text-sm">A IA analisa a sua expressão facial, frame a frame, para detetar emoções sustentadas como frustração ou foco.</p>
            </div>

            <div className="flex flex-col items-center p-6 bg-slate-900/50 border border-slate-800 rounded-2xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-400/30">
                <Lightbulb size={32} className="text-emerald-400"/>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">3. Feedback Inteligente</h3>
              <p className="text-slate-400 text-sm">Ao detetar frustração, o sistema oferece dicas. Com foco, avança. Tudo de forma automática e discreta.</p>
            </div>
          </div>
        </section>

        <footer className="w-full max-w-7xl mx-auto mt-20 sm:mt-24 md:mt-32 p-6 md:p-12 z-10 text-center border-t border-slate-800">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-left">

            <div className="p-6 rounded-2xl border border-transparent hover:border-indigo-500/50 hover:bg-slate-900/50 transition-all duration-300 transform hover:-translate-y-1">
              <WholeWord size={32} className="mb-4 text-indigo-400" />
              <h3 className="font-bold text-white text-lg mb-2">Research-Driven</h3>
              <p className="text-slate-400 text-sm">
                Este projeto investiga a questão: "A adaptação emocional melhora a retenção e o engajamento na aprendizagem online?".
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-transparent hover:border-amber-500/50 hover:bg-slate-900/50 transition-all duration-300 transform hover:-translate-y-1">
              <TestTube2 size={32} className="mb-4 text-amber-400" />
              <h3 className="font-bold text-white text-lg mb-2">Tecnologia de Ponta</h3>
              <p className="text-slate-400 text-sm">
                Utiliza MediaPipe da Google e Next.js para uma análise de alta performance que corre diretamente no seu navegador.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-transparent hover:border-emerald-500/50 hover:bg-slate-900/50 transition-all duration-300 transform hover:-translate-y-1">
              <ShieldCheck size={32} className="mb-4 text-emerald-400" />
              <h3 className="font-bold text-white text-lg mb-2">Privacidade Garantida</h3>
              <p className="text-slate-400 text-sm">
                Nenhuma imagem ou vídeo sai do seu dispositivo. Todo o processamento biométrico é 100% local e anónimo.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}