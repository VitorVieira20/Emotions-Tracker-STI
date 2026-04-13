import prisma from '@/app/lib/prisma';
import { Difficulty } from '@/types/Difficulty';

export async function initializeQuiz(userId: string, selectedArea?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      englishLevel: true,
      strongAreas: true,
      weakAreas: true,
    },
  });

  if (!user || !user.englishLevel) {
    throw new Error('User profile is not complete');
  }

  let focusArea: string;
  let targetDifficulty: Difficulty;

  // 1. STRICT AREA OVERRIDE
  if (selectedArea) {
    focusArea = selectedArea;
    targetDifficulty = 'Medium';

    // Logic for Manual Mode: Strictly use the selected area
    const questions = await prisma.question.findMany({
      where: {
        cefrLevel: user.englishLevel,
        area: { equals: focusArea, mode: 'insensitive' }, // String Normalization
        difficulty: targetDifficulty,
      },
    });

    if (questions.length === 0) {
      console.warn(`No questions found for ${focusArea} at level ${user.englishLevel}. Trying fallback within area.`);
      
      // Fallback 1: Same area, any difficulty at user level
      const fallbackSameLevel = await prisma.question.findMany({
        where: {
          cefrLevel: user.englishLevel,
          area: { equals: focusArea, mode: 'insensitive' },
        },
      });

      if (fallbackSameLevel.length > 0) {
        const firstQuestion = fallbackSameLevel[Math.floor(Math.random() * fallbackSameLevel.length)];
        const quizAttempt = await prisma.quizAttempt.create({
          data: { userId, selectedArea: focusArea },
        });
        return { attemptId: quizAttempt.id, firstQuestion };
      }

      // Fallback 2: Same area, any level (last resort for that specific topic)
      const fallbackAnyLevel = await prisma.question.findMany({
        where: {
          area: { equals: focusArea, mode: 'insensitive' },
        },
      });

      if (fallbackAnyLevel.length === 0) {
        throw new Error(`Não foram encontradas questões para a área: ${focusArea}`);
      }

      const firstQuestion = fallbackAnyLevel[Math.floor(Math.random() * fallbackAnyLevel.length)];
      const quizAttempt = await prisma.quizAttempt.create({
        data: { userId, selectedArea: focusArea },
      });
      return { attemptId: quizAttempt.id, firstQuestion };
    }

    const firstQuestion = questions[Math.floor(Math.random() * questions.length)];
    const quizAttempt = await prisma.quizAttempt.create({
      data: { userId, selectedArea: focusArea },
    });
    return { attemptId: quizAttempt.id, firstQuestion };

  } else {
    // 2. ADAPTIVE MODE (Original logic)
    const useWeakArea = Math.random() > 0.5;
    if (useWeakArea && user.weakAreas.length > 0) {
      focusArea = user.weakAreas[Math.floor(Math.random() * user.weakAreas.length)];
      targetDifficulty = 'Easy';
    } else if (user.strongAreas.length > 0) {
      focusArea = user.strongAreas[Math.floor(Math.random() * user.strongAreas.length)];
      targetDifficulty = 'Medium';
    } else {
      focusArea = 'Grammar';
      targetDifficulty = 'Easy';
    }

    const questions = await prisma.question.findMany({
      where: {
        cefrLevel: user.englishLevel,
        area: focusArea,
        difficulty: targetDifficulty,
      },
    });

    if (questions.length === 0) {
      const fallbackQuestions = await prisma.question.findMany({
        where: {
          cefrLevel: user.englishLevel,
          difficulty: 'Easy',
        },
      });
      if (fallbackQuestions.length === 0) {
        throw new Error('No questions found for this user level.');
      }
      const firstQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
      const quizAttempt = await prisma.quizAttempt.create({
        data: { 
          userId: userId,
          selectedArea: null 
        },
      });
      return {
        attemptId: quizAttempt.id,
        firstQuestion: firstQuestion,
      };
    }

    const firstQuestion = questions[Math.floor(Math.random() * questions.length)];
    const quizAttempt = await prisma.quizAttempt.create({
      data: { 
        userId: userId,
        selectedArea: null 
      },
    });

    return {
      attemptId: quizAttempt.id,
      firstQuestion: firstQuestion,
    };
  }
}
