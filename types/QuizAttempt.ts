import { QuestionResponse } from "./QuestionResponse"

export type QuizAttempt = {
    avgFrustration: number,
    startTime: Date,
    endTime: Date | null,
    score: number,
    totalHintsUsed: number,
    totalQuestions: number,
    userId: string,
    responses: QuestionResponse[]
}