import { Difficulty } from "./Difficulty"

export type Question = {
    id: string,
    area: string,
    cefrLevel: string,
    correctOption: number,
    difficulty: Difficulty,
    hint: string,
    options: string[],
    text: string
}