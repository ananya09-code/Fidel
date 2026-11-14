type SentenceCandidate = {
  id: string;
  locked: boolean;
  completed: boolean;
  tiles: { word_id: string }[];
};

/** Offer one ready sentence that uses the word just answered correctly. */
export function sentenceAfterWord<T extends SentenceCandidate>(
  exercises: T[], wordId: string, shown: ReadonlySet<string>,
): T | undefined {
  return exercises.find((exercise) =>
    !exercise.locked && !exercise.completed && !shown.has(exercise.id)
    && exercise.tiles.some((tile) => tile.word_id === wordId),
  );
}
