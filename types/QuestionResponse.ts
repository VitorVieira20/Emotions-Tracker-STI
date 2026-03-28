import { Question } from "./Question"

export type QuestionResponse = {
  id: string,
  attemptId: string,
  frustrationLevel: number,
  hintUsed: boolean,
  isCorrect: boolean,
  questionId: string,
  timeSpentSeconds: number,
  question: Question
}