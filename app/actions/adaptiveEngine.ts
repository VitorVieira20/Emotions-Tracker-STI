'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';
import { quizFinalStats } from '../lib/utils/quiz-helpers';
import { QuestionResponse } from '@/types/QuestionResponse';
import { Difficulty } from '@/types/Difficulty';

export async function startAdaptiveQuiz() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const userId = session.user.id;

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
        data: { userId: userId },
      });
      return {
        attemptId: quizAttempt.id,
        firstQuestion: firstQuestion,
      };
    }

    const firstQuestion = questions[Math.floor(Math.random() * questions.length)];
    const quizAttempt = await prisma.quizAttempt.create({
      data: { userId: userId },
    });

    return {
      attemptId: quizAttempt.id,
      firstQuestion: firstQuestion,
    };
  } catch (error) {
    console.error('Error starting adaptive quiz:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unknown error occurred' };
  }
}

export async function submitAnswerAndGetNext(
  attemptId: string,
  currentQuestionId: string,
  isCorrect: boolean,
  hintUsed: boolean,
  frustrationLevel: number,
  timeSpentSeconds: number
) {
  try {
    await prisma.questionResponse.create({
      data: {
        attemptId,
        questionId: currentQuestionId,
        isCorrect,
        hintUsed,
        frustrationLevel,
        timeSpentSeconds,
      },
    });

    const responseCount = await prisma.questionResponse.count({
      where: { attemptId },
    });

    const QUIZ_LENGTH = 10;


    if (responseCount >= QUIZ_LENGTH) {
      const allResponses = await prisma.questionResponse.findMany({
        where: { attemptId },
      }) as QuestionResponse[];
      
      const totalQuestions = allResponses.length;
      const { finalScore, totalHints, avgFrustration } = quizFinalStats(allResponses);

      await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          endTime: new Date(),
          score: finalScore,
          totalQuestions: totalQuestions,
          avgFrustration: avgFrustration,
          totalHintsUsed: totalHints
        },
      });
      return { finished: true };
    }

    // 3. Apply the adaptive matrix
    const currentQuestion = await prisma.question.findUnique({
      where: { id: currentQuestionId },
    });

    if (!currentQuestion) {
      throw new Error('Current question not found');
    }

    let nextDifficulty: Difficulty = currentQuestion.difficulty as Difficulty;
    const currentDifficulty = nextDifficulty;

    if (isCorrect) {
      if (frustrationLevel < 50 && !hintUsed) {
        // Promote
        if (currentDifficulty === 'Easy') nextDifficulty = 'Medium';
        else if (currentDifficulty === 'Medium') nextDifficulty = 'Hard';
      }
      // Else: Maintain difficulty
    } else {
      if (frustrationLevel >= 50) {
        // Heavy Demotion
        nextDifficulty = 'Easy';
      } else {
        // Demote
        if (currentDifficulty === 'Hard') nextDifficulty = 'Medium';
        else if (currentDifficulty === 'Medium') nextDifficulty = 'Easy';
      }
    }

    const answeredQuestionIds = await prisma.questionResponse.findMany({
        where: { attemptId },
        select: { questionId: true },
    }).then((responses: QuestionResponse[]) => responses.map(r => r.questionId));

    let nextQuestions = await prisma.question.findMany({
        where: {
            cefrLevel: currentQuestion.cefrLevel,
            area: currentQuestion.area,
            difficulty: nextDifficulty,
            id: { notIn: answeredQuestionIds },
        }
    });

    if (nextQuestions.length === 0) {
      const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: { user: true }
      });
      const weakAreas = attempt?.user?.weakAreas || [];

      const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const currentLevelIndex = cefrLevels.indexOf(currentQuestion.cefrLevel);
      const levelBelow = currentLevelIndex > 0 ? cefrLevels[currentLevelIndex - 1] : null;
      const levelAbove = currentLevelIndex < cefrLevels.length - 1 ? cefrLevels[currentLevelIndex + 1] : null;

      if (weakAreas.length > 0) {
        nextQuestions = await prisma.question.findMany({
          where: {
            cefrLevel: currentQuestion.cefrLevel,
            area: { in: weakAreas },
            id: { notIn: answeredQuestionIds },
          }
        });
      }

      if (nextQuestions.length === 0) {
        nextQuestions = await prisma.question.findMany({
          where: {
            cefrLevel: currentQuestion.cefrLevel,
            id: { notIn: answeredQuestionIds },
          }
        });
      }

      if (nextQuestions.length === 0 && (levelBelow || levelAbove)) {
        const orConditions = [];
        if (levelBelow) orConditions.push({ cefrLevel: levelBelow, difficulty: 'Hard' });
        if (levelAbove) orConditions.push({ cefrLevel: levelAbove, difficulty: 'Easy' });

        nextQuestions = await prisma.question.findMany({
          where: {
            OR: orConditions,
            id: { notIn: answeredQuestionIds },
          }
        });
      }
    }

    if (nextQuestions.length === 0) {
      const allResponses = await prisma.questionResponse.findMany({
        where: { attemptId },
      }) as QuestionResponse[];

      const totalQuestions = allResponses.length;
      const { finalScore, totalHints, avgFrustration } = quizFinalStats(allResponses);

      await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          endTime: new Date(),
          score: finalScore,
          totalQuestions: totalQuestions,
          avgFrustration: avgFrustration,
          totalHintsUsed: totalHints
        },
      });

      return { finished: true };
    }

    const nextQuestion = nextQuestions[Math.floor(Math.random() * nextQuestions.length)];

    return { finished: false, nextQuestion: nextQuestion };

  } catch (error) {
    console.error('Error submitting answer:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unknown error occurred' };
  }
}
