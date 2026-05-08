'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';
import { quizFinalStats } from '../lib/utils/quiz-helpers';
import { QuestionResponse } from '@/types/QuestionResponse';
import { Difficulty } from '@/types/Difficulty';
import { initializeQuiz } from '../services/quizService';
import { QuizStatus } from '@/types/QuizStatus';

export async function startAdaptiveQuiz(selectedArea?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const result = await initializeQuiz(session.user.id, selectedArea);
    return { attemptId: result.attemptId };
  } catch (error) {
    console.error('Error starting adaptive quiz:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unknown error occurred' };
  }
}

export async function getQuizAttemptStatus(attemptId: string) {
  try {
    console.log(`[DEBUG] getQuizAttemptStatus called with attemptId: ${attemptId}`);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('[DEBUG] User not authenticated');
      throw new Error('User not authenticated');
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId, userId: session.user.id },
      include: {
        responses: {
          include: {
            question: true,
          },
        },
        user: true,
      },
    });

    if (!attempt) {
      console.error(`[DEBUG] Quiz attempt not found for ID: ${attemptId}`);
      throw new Error('Quiz attempt not found');
    }

    if (attempt.status === QuizStatus.COMPLETED || attempt.endTime) {
      return { finished: true };
    }

    const responseCount = attempt.responses.length;
    const QUIZ_LENGTH = 10;

    if (responseCount >= QUIZ_LENGTH) {
      await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: { status: QuizStatus.COMPLETED, endTime: new Date() }
      });
      return { finished: true };
    }

    // Resumption logic
    if (responseCount > 0) {
      console.log(`[DEBUG] Resumption logic for responseCount: ${responseCount}`);
      
      const lastResponse = attempt.responses[responseCount - 1];
      const currentQuestion = lastResponse.question;
      
      const focusArea = attempt.selectedArea || currentQuestion.area;
      const skillLevel = await prisma.userSkillLevel.findFirst({
        where: { userId: session.user.id, area: { equals: focusArea, mode: 'insensitive' } }
      });
      const effectiveLevel = skillLevel ? skillLevel.level : attempt.user.englishLevel!;

      const answeredQuestionIds = attempt.responses.map(r => r.questionId);
      
      const nextQuestions = await prisma.question.findMany({
        where: {
          cefrLevel: effectiveLevel,
          area: { equals: focusArea, mode: 'insensitive' },
          id: { notIn: answeredQuestionIds },
        },
        take: 10
      });

      const nextQuestion = nextQuestions.length > 0 
        ? nextQuestions[Math.floor(Math.random() * nextQuestions.length)]
        : null;

      if (!nextQuestion) {
        return { finished: true };
      }

      return {
        finished: false,
        question: nextQuestion,
        questionNumber: responseCount + 1
      };
    }

    // Initial load logic (responseCount === 0)
    console.log(`[DEBUG] Initial load logic for attemptId: ${attemptId}`);
    const user = attempt.user;
    if (!user) throw new Error('User not found');

    const focusArea = attempt.selectedArea || 'Grammar';
    
    const skillLevel = await prisma.userSkillLevel.findFirst({
      where: { userId: session.user.id, area: { equals: focusArea, mode: 'insensitive' } }
    });
    const effectiveLevel = skillLevel ? skillLevel.level : user.englishLevel!;

    console.log(`[DEBUG] Fetching questions for level: ${effectiveLevel}, area: ${focusArea}`);
    const questions = await prisma.question.findMany({
      where: {
        cefrLevel: effectiveLevel,
        area: { equals: focusArea, mode: 'insensitive' },
      },
      take: 20
    });
    
    const firstQuestion = questions.length > 0 
      ? questions[Math.floor(Math.random() * questions.length)]
      : null;

    if (!firstQuestion) {
        console.log(`[DEBUG] No questions found for area ${focusArea}, trying level fallback`);
        const anyQuestion = await prisma.question.findFirst({
            where: { cefrLevel: effectiveLevel }
        });
        
        if (!anyQuestion) {
          console.log(`[DEBUG] No questions found for level ${effectiveLevel}, trying absolute fallback`);
          const absoluteFallback = await prisma.question.findFirst();
          return { finished: false, question: absoluteFallback, questionNumber: 1 };
        }
        
        return { finished: false, question: anyQuestion, questionNumber: 1 };
    }

    return {
      finished: false,
      question: firstQuestion,
      questionNumber: 1
    };

  } catch (error) {
    console.error('Error getting quiz status:', error);
    return { error: error instanceof Error ? error.message : 'Failed to load quiz.' };
  }
}

export async function submitAnswerAndGetNext(
  attemptId: string,
  currentQuestionId: string,
  isCorrect: boolean,
  userAnswer: string,
  hintUsed: boolean,
  frustrationLevel: number,
  timeSpentSeconds: number
) {
  try {
    // 1. Save the Response immediately
    await prisma.questionResponse.create({
      data: {
        attemptId,
        questionId: currentQuestionId,
        isCorrect,
        userAnswer,
        hintUsed,
        frustrationLevel,
        timeSpentSeconds,
      },
    });

    // 2. Fetch all current responses to calculate progress
    const allResponses = await prisma.questionResponse.findMany({
      where: { attemptId },
      include: { question: true }
    }) as unknown as QuestionResponse[];

    const responseCount = allResponses.length;
    const QUIZ_LENGTH = 10;
    
    // 3. Update the QuizAttempt with intermediate results
    const { finalScore, totalHints, avgFrustration } = quizFinalStats(allResponses);
    const totalTimeSpent = allResponses.reduce((acc, r) => acc + (r.timeSpentSeconds || 0), 0);

    const isFinished = responseCount >= QUIZ_LENGTH;

    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score: finalScore,
        totalQuestions: responseCount,
        avgFrustration: avgFrustration,
        totalHintsUsed: totalHints,
        status: isFinished ? QuizStatus.COMPLETED : QuizStatus.IN_PROGRESS,
        endTime: isFinished ? new Date() : null,
      },
    });

    if (isFinished) {
      return { 
        finished: true, 
        stats: { 
          score: finalScore, 
          totalQuestions: responseCount, 
          totalHints, 
          avgFrustration,
          totalTimeSpent 
        } 
      };
    }

    const currentQuestion = await prisma.question.findUnique({
      where: { id: currentQuestionId },
    });

    if (!currentQuestion) throw new Error('Current question not found');

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { user: true }
    });

    if (!attempt) throw new Error('Quiz attempt not found');

    const focusArea = attempt.selectedArea || currentQuestion.area;

    const skillLevel = await prisma.userSkillLevel.findFirst({
      where: { userId: attempt.userId, area: { equals: focusArea, mode: 'insensitive' } }
    });
    const effectiveLevel = skillLevel ? skillLevel.level : attempt.user.englishLevel!;

    let nextDifficulty: Difficulty = currentQuestion.difficulty as Difficulty;
    const currentDifficulty = nextDifficulty;

    if (isCorrect) {
      if (frustrationLevel < 50 && !hintUsed) {
        if (currentDifficulty === 'Easy') nextDifficulty = 'Medium';
        else if (currentDifficulty === 'Medium') nextDifficulty = 'Hard';
      }
    } else {
      if (frustrationLevel >= 50) {
        nextDifficulty = 'Easy';
      } else {
        if (currentDifficulty === 'Hard') nextDifficulty = 'Medium';
        else if (currentDifficulty === 'Medium') nextDifficulty = 'Easy';
      }
    }

    const answeredQuestionIds = allResponses.map(r => r.questionId);

    let nextQuestions = await prisma.question.findMany({
      where: {
        cefrLevel: effectiveLevel,
        area: { equals: focusArea, mode: 'insensitive' },
        difficulty: nextDifficulty,
        id: { notIn: answeredQuestionIds },
      }
    });

    if (nextQuestions.length === 0) {
      const weakAreas = attempt.user.weakAreas || [];
      const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const currentLevelIndex = cefrLevels.indexOf(effectiveLevel);
      const levelBelow = currentLevelIndex > 0 ? cefrLevels[currentLevelIndex - 1] : null;
      const levelAbove = currentLevelIndex < cefrLevels.length - 1 ? cefrLevels[currentLevelIndex + 1] : null;

      if (weakAreas.length > 0 && !attempt.selectedArea) {
        nextQuestions = await prisma.question.findMany({
          where: {
            cefrLevel: effectiveLevel,
            area: { in: weakAreas },
            id: { notIn: answeredQuestionIds },
          }
        });
      }

      if (nextQuestions.length === 0) {
        nextQuestions = await prisma.question.findMany({
          where: {
            cefrLevel: effectiveLevel,
            area: { equals: focusArea, mode: 'insensitive' },
            id: { notIn: answeredQuestionIds },
          }
        });
      }

      if (nextQuestions.length === 0 && (levelBelow || levelAbove)) {
        const orConditions: any[] = [];
        if (levelBelow) orConditions.push({ cefrLevel: levelBelow, difficulty: 'Hard', area: { equals: focusArea, mode: 'insensitive' } });
        if (levelAbove) orConditions.push({ cefrLevel: levelAbove, difficulty: 'Easy', area: { equals: focusArea, mode: 'insensitive' } });

        nextQuestions = await prisma.question.findMany({
          where: {
            OR: orConditions,
            id: { notIn: answeredQuestionIds },
          }
        });
      }
    }

    if (nextQuestions.length === 0) {
      await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          status: QuizStatus.COMPLETED,
          endTime: new Date(),
        },
      });

      return { 
        finished: true, 
        stats: { 
          score: finalScore, 
          totalQuestions: responseCount, 
          totalHints, 
          avgFrustration,
          totalTimeSpent 
        } 
      };
    }

    const nextQuestion = nextQuestions[Math.floor(Math.random() * nextQuestions.length)];

    return { finished: false, nextQuestion: nextQuestion };

  } catch (error) {
    console.error('Error submitting answer:', error);
    if (error instanceof Error) return { error: error.message };
    return { error: 'An unknown error occurred' };
  }
}
