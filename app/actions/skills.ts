'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function levelUpSkill(area: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, message: 'Not authenticated.' };
  }

  try {
    const userId = session.user.id;
    
    const currentSkill = await prisma.userSkillLevel.findUnique({
      where: {
        userId_area: {
          userId,
          area,
        }
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const currentLevel = currentSkill?.level || user?.englishLevel || 'A1';
    
    const nextLevelMap: Record<string, string> = {
      'A1': 'A2',
      'A2': 'B1',
      'B1': 'B2',
      'B2': 'C1',
      'C1': 'C2',
    };

    const nextLevel = nextLevelMap[currentLevel];

    if (!nextLevel) {
      return { success: false, message: 'Já atingiu o nível máximo.' };
    }

    await prisma.userSkillLevel.upsert({
      where: {
        userId_area: {
          userId,
          area,
        }
      },
      update: {
        level: nextLevel,
      },
      create: {
        userId,
        area,
        level: nextLevel,
      }
    });

    revalidatePath('/dashboard');
    return { success: true, nextLevel };
  } catch (error) {
    console.error('Level up error:', error);
    return { success: false, message: 'Falha ao subir de nível.' };
  }
}
