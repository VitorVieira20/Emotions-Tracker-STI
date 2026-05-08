import { QuestionResponse } from "./QuestionResponse"

export type QuizAttempt = {
    id: string
    status?: 'IN_PROGRESS' | 'COMPLETED',
    avgFrustration: number,
    startTime: Date,
    endTime: Date | null,
    score: number,
    totalHintsUsed: number,
    totalQuestions: number,
    userId: string,
    selectedArea: string | null,
    responses: QuestionResponse[]
}