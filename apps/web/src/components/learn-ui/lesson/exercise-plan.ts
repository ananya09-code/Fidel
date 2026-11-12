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

/** Two recognition questions, then 3–5 unambiguous pairs; the rest stay choice. */
export function matchingIndices(words: WordIdentity[], variant: "practice" | "quiz"): number[] {
  if (variant === "quiz") return [];
  const labels = new Set<string>();
  const meanings = new Set<string>();
  const ids = new Set<string>();
  const indices: number[] = [];
  for (let i = 2; i < Math.min(words.length, 7); i++) {
    const word = words[i];
    const label = normalize(word.word);
    const meaning = normalize(word.meaning);
    if (!label || !meaning || labels.has(label) || meanings.has(meaning) || ids.has(word.id)) break;
    labels.add(label); meanings.add(meaning); ids.add(word.id); indices.push(i);
  }
  return indices.length >= 3 ? indices : [];
}

/** One audio question per session, outside the matching round. Stable on resume. */
export function listeningIndex(
  words: (WordIdentity & { audioUrl?: string | null })[],
  variant: "practice" | "quiz",
): number {
  if (words.length < 2) return -1;
  const matching = new Set(matchingIndices(words, variant));
  const eligible = words.map((word, index) => word.audioUrl && !matching.has(index) ? index : -1)
    .filter(index => index >= 0);
  return eligible.find(index => index > 0) ?? eligible[0] ?? -1;
}
