'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function AuthButtons() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <p className="text-slate-400">Welcome, {session.user?.name}</p>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 font-bold text-white bg-red-500 rounded-md hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => signIn()}
        className="px-4 py-2 font-bold text-slate-950 bg-blue-500 rounded-md hover:bg-blue-600"
      >
        Login
      </button>
      <Link href="/register">
        <button className="px-4 py-2 font-bold text-white bg-slate-700 rounded-md hover:bg-slate-600">
            Register
        </button>
      </Link>
    </div>
  );
}
