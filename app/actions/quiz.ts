'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function getUserBaseline() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      frownBase: true,
      frownMax: true,
      smileMax: true
    }
  });

  return user;
}