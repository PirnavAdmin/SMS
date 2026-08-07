export interface RankableItem {
  studentId: string;
  score: number;
}

/**
 * Calculates standard competition ranking (1, 2, 2, 4) for student scores.
 * @param scores Array of student scores (can be unordered).
 * @returns Map of studentId to their rank.
 */
export function calculateCompetitionRanks(scores: RankableItem[]): Record<string, number> {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const ranks: Record<string, number> = {};
  
  sorted.forEach((item, index) => {
    if (index > 0 && item.score === sorted[index - 1].score) {
      // Tie: assign the same rank as the first occurrence
      const firstIndex = sorted.findIndex(x => x.score === item.score);
      ranks[item.studentId] = firstIndex + 1;
    } else {
      ranks[item.studentId] = index + 1;
    }
  });
  
  return ranks;
}
