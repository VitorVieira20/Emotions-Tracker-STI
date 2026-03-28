export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Response = {
  attemptId: string,
  frustrationLevel: number,
  hintUsed: boolean,
  isCorrect: boolean,
  questionId: string,
  timeSpentSeconds: number
}

export function quizFinalStats(allResponses: Response[]) {
  const totalQuestions = allResponses.length;
  const finalScore = allResponses.filter((r) => r.isCorrect).length;
  const totalHints = allResponses.filter((r) => r.hintUsed).length;
  const avgFrustration = totalQuestions > 0 
        ? allResponses.reduce((acc, r) => acc + r.frustrationLevel, 0) / totalQuestions
        : 0;

  return { finalScore, totalHints, avgFrustration }
}