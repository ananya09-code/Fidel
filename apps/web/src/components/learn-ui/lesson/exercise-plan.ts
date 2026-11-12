type WordIdentity = { id: string; word: string; meaning: string };

export function shuffleExercise<T>(items: T[], seed: string): T[] {
  let state = [...seed].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = Math.floor(state / 4294967296 * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const normalize = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase("en").replace(/\s+/g, " ");

/** A contiguous round of unambiguous pairs after two choice questions. */
export function matchingIndices(words: WordIdentity[], variant: "practice" | "quiz"): number[] {
  if (variant === "quiz" && words.length < 8) return [];
  const target = variant === "quiz"
    ? Math.min(5, Math.max(3, Math.round(words.length / 4)))
    : 5;
  if (variant === "quiz") {
    // Keep the round contiguous so finishing it never skips an unanswered word.
    for (let size = target; size >= 3; size--) {
      for (let start = 2; start + size <= words.length; start++) {
        const block = words.slice(start, start + size);
        if (new Set(block.map(word => normalize(word.word))).size !== size ||
            new Set(block.map(word => normalize(word.meaning))).size !== size ||
            new Set(block.map(word => word.id)).size !== size ||
            block.some(word => !normalize(word.word) || !normalize(word.meaning))) continue;
        return block.map((_, offset) => start + offset);
      }
    }
    return [];
  }
  const labels = new Set<string>();
  const meanings = new Set<string>();
  const ids = new Set<string>();
  const indices: number[] = [];
  for (let i = 2; i < Math.min(words.length, 2 + target); i++) {
    const word = words[i];
    const label = normalize(word.word);
    const meaning = normalize(word.meaning);
    if (!label || !meaning || labels.has(label) || meanings.has(meaning) || ids.has(word.id)) break;
    labels.add(label); meanings.add(meaning); ids.add(word.id); indices.push(i);
  }
  return indices.length >= 3 ? indices : [];
}

/** About a quarter of review words use audio; practice introduces one. Stable on resume. */
export function listeningIndices(
  words: (WordIdentity & { audioUrl?: string | null })[],
  variant: "practice" | "quiz",
): number[] {
  if (words.length < 2) return [];
  const matching = new Set(matchingIndices(words, variant));
  const eligible = words.map((word, index) => word.audioUrl && !matching.has(index) ? index : -1)
    .filter(index => index >= 0);
  const target = variant === "quiz" ? Math.min(5, Math.max(1, Math.floor(words.length / 4))) : 1;
  const preferred = eligible.filter(index => index > 0);
  const candidates = preferred.length >= target ? preferred : eligible;
  const count = Math.min(target, candidates.length);
  return Array.from({ length: count }, (_, slot) => candidates[Math.floor((slot + .5) * candidates.length / count)]);
}
