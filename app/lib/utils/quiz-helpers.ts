import { QuestionResponse } from "@/types/QuestionResponse";

export function quizFinalStats(allResponses: QuestionResponse[]) {
  const totalQuestions = allResponses.length;
  const finalScore = allResponses.filter((r) => r.isCorrect).length;
  const totalHints = allResponses.filter((r) => r.hintUsed).length;
  const avgFrustration = totalQuestions > 0 
        ? allResponses.reduce((acc, r) => acc + r.frustrationLevel, 0) / totalQuestions
        : 0;

  return { finalScore, totalHints, avgFrustration }
}