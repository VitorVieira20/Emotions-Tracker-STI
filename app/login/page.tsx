'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, AlertCircle, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    setLoading(false);

    if (result?.error) {
      setError('Utilizador ou palavra-passe inválidos.');
    } else if (result?.ok) {
      router.push('/dashboard');
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-gradient {
          0%, 100% { background-position: 50% 0%; }
          50% { background-position: 50% 100%; }
        }
      `}</style>
      
      <div 
        className="min-h-screen w-full bg-slate-950 text-slate-50 font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(55, 65, 81, 0.4), rgba(255, 255, 255, 0))',
          animation: 'pulse-gradient 8s ease-in-out infinite',
        }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-800/[0.2] mask-[linear-gradient(to_bottom,white_5%,transparent_50%)]"></div>

        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Voltar à Home</span>
          </Link>
        </div>

        <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-sm z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-500/20 mb-4 border border-indigo-400/30">
              <LogIn size={32} className="text-indigo-300"/>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-50">Bem-vindo de Volta</h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base">Faça login para aceder ao seu dashboard.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="text-sm font-medium text-slate-400"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 mt-1 text-slate-50 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-400"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 mt-1 text-slate-50 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 px-4 py-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-indigo-500/50 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg shadow-indigo-500/20"
              >
                {loading ? 'A entrar...' : 'Login'}
              </button>
            </div>
          </form>

          <p className="text-sm text-center text-slate-400">
            Não tem uma conta?{' '}
            <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline">
              Registe-se aqui
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
