export interface Skill {
  topic: string;
  level: string;
  mastery: number;
  canLevelUp: boolean;
  nextLevel?: string;
  color: string;
  totalInLevel: number;
  correctInLevel: number;
}
