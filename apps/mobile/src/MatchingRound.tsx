import { useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { shuffleExercise } from "../../web/src/components/learn-ui/lesson/exercise-plan";
import { useFeedback } from "./feedback";
import { Button, Card, Copy, grow, Heading, Label, Press, Problem, row, Teacher, usePalette, WordText } from "./ui";

export type MatchingWord = { id: string; text: string; meaning: string; amharic: string | null };

export function MatchingRound({ words, initialAnswers, onAnswer, onComplete }: {
  words: MatchingWord[];
  initialAnswers: Record<string, boolean>;
  onAnswer: (wordId: string, selectedWordId: string) => Promise<void>;
  onComplete: () => void;
}) {
  const color = usePalette();
  const playFeedback = useFeedback();
  const seed = words.map((word) => word.id).join("|");
  const left = useMemo(() => shuffleExercise(words, seed + "-words"), [seed, words]);
  const right = useMemo(() => {
    const mixed = shuffleExercise(words, seed + "-meanings");
    return mixed.every((word, index) => word.id === left[index]?.id) ? [...mixed.slice(1), mixed[0]] : mixed;
  }, [left, seed, words]);
  const [results, setResults] = useState<Record<string, boolean>>(initialAnswers);
  const [matched, setMatched] = useState(() => new Set(Object.keys(initialAnswers)));
  const [selectedWord, setSelectedWord] = useState<string>();
  const [selectedMeaning, setSelectedMeaning] = useState<string>();
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState<Error>();
  const [message, setMessage] = useState("Tap one word and one meaning to make a pair.");

  async function choose(side: "word" | "meaning", id: string) {
    if (busy.current || saving || matched.has(id)) return;
    const wordId = side === "word" ? selectedWord === id ? undefined : id : selectedWord;
    const meaningId = side === "meaning" ? selectedMeaning === id ? undefined : id : selectedMeaning;
    setSelectedWord(wordId);
    setSelectedMeaning(meaningId);
    if (!wordId || !meaningId) return;
    busy.current = true;
    setSaving(true);
    setError(undefined);
    try {
      if (!(wordId in results)) {
        await onAnswer(wordId, meaningId);
        setResults((previous) => ({ ...previous, [wordId]: wordId === meaningId }));
      }
      if (wordId === meaningId) {
        void playFeedback("correct");
        setMatched((previous) => new Set([...previous, wordId]));
        setMessage(results[wordId] === false ? "Pair found. The first miss stays in your review history." : "That’s a pair.");
      } else {
        void playFeedback("retry");
        setMessage("Try another meaning. Your first answer is saved for review.");
      }
      setSelectedWord(undefined);
      setSelectedMeaning(undefined);
    } catch (failure) {
      setError(failure instanceof Error ? failure : new Error("Your pair could not be saved."));
      setMessage("Your pair could not be saved. Try again.");
      setSelectedWord(undefined);
      setSelectedMeaning(undefined);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  function tile(word: MatchingWord, side: "word" | "meaning") {
    const selected = side === "word" ? selectedWord === word.id : selectedMeaning === word.id;
    const done = matched.has(word.id);
    return <Press key={`${side}-${word.id}`} onPress={() => void choose(side, word.id)} disabled={saving || done}
      selected={selected} label={side === "word" ? word.text : `${word.meaning}, ${word.amharic ?? "Amharic translation unavailable"}`}
      style={{ minHeight: 70, padding: 9, borderWidth: selected ? 2 : 1, borderColor: selected ? color.gold : color.line,
        borderRadius: 8, backgroundColor: done ? color.tint : color.panel, justifyContent: "center", opacity: done ? 0.55 : 1 }}>
      {side === "word" ? <WordText size={18}>{word.text}</WordText> : <View><Label size={14} strong>{word.meaning}</Label><WordText size={12}>{word.amharic ?? "Translation unavailable"}</WordText></View>}
    </Press>;
  }

  return <Card style={{ gap: 14 }}>
    <View style={row}><Teacher size={36} /><View style={grow}><Heading>Match the pairs</Heading><Copy>{message}</Copy></View></View>
    <Label muted size={13}>{matched.size} / {words.length} pairs</Label>
    <View style={[row, { alignItems: "flex-start" }]}>
      <View style={[grow, { gap: 7 }]}><Label muted size={12}>Words</Label>{left.map((word) => tile(word, "word"))}</View>
      <View style={[grow, { gap: 7 }]}><Label muted size={12}>English · Amharic</Label>{right.map((word) => tile(word, "meaning"))}</View>
    </View>
    {error && <Problem error={error} />}
    <Label muted size={12}>First answers count. Missed words stay in review.</Label>
    <Button title="Continue practice" kind="gold" icon="arrow" disabled={matched.size !== words.length || saving} onPress={onComplete} />
  </Card>;
}
