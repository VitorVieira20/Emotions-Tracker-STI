'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function completeOnboarding(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, message: 'Not authenticated.' };
  }

  try {
    const name = formData.get('name') as string;
    const englishLevel = formData.get('englishLevel') as string;
    const strongAreas = formData.getAll('strongAreas') as string[];
    const weakAreas = formData.getAll('weakAreas') as string[];
    const frownBase = parseFloat(formData.get('frownBase') as string);
    const frownMax = parseFloat(formData.get('frownMax') as string);
    const smileMax = parseFloat(formData.get('smileMax') as string);

    const areas = ['Listening', 'Reading', 'Writing', 'Speaking', 'Grammar', 'Vocabulary'];

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        englishLevel,
        strongAreas,
        weakAreas,
        frownBase,
        frownMax,
        smileMax,
        onboardingCompleted: true,
        skillLevels: {
          createMany: {
            data: areas.map(area => ({
              area,
              level: englishLevel,
            }))
          }
        }
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/quiz');
    revalidatePath('/onboarding');


    return { success: true };
  } catch (error) {
    console.error('Onboarding completion error:', error);
    return { success: false, message: 'Failed to save onboarding data.' };
  }
}
