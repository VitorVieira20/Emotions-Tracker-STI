'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { LogIn, LogOut, UserPlus } from 'lucide-react';
import Image from 'next/image';

export default function AuthButtons() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-400 hidden sm:inline">
          Bem-vindo, <span className="font-bold text-slate-200">{session.user?.name}</span>
        </span>
        {session.user?.image && (
          <Image 
            src={session.user.image} 
            alt={session.user.name || 'User avatar'}
            width={36}
            height={36}
            className="rounded-full border-2 border-slate-700"
          />
        )}
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 hover:text-rose-300 transition-colors duration-300 cursor-pointer"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/register" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-800/80 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-white transition-colors duration-300 cursor-pointer">
            <UserPlus size={16} />
            Register
      </Link>
      <button
        onClick={() => signIn()}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors duration-300 shadow-lg shadow-indigo-500/20 transform hover:scale-105 cursor-pointer"
      >
        <LogIn size={16} />
        Login
      </button>
    </div>
  );
}
