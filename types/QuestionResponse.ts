import { Question } from "./Question"

export type QuestionResponse = {
  id: string,
  attemptId: string,
  frustrationLevel: number,
  hintUsed: boolean,
  isCorrect: boolean,
  userAnswer: string,
  questionId: string,
  timeSpentSeconds: number,
  question: Question
}