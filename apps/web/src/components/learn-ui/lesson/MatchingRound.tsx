import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, LoaderCircle, X } from "lucide-react";
import type { FlashcardWord } from "./Flashcard";
import { shuffleExercise } from "./exercise-plan";
import { TeacherFeedback } from "./TeacherFeedback";
import type { EncouragementEvent } from "./encouragement";
import "./matching.css";

type Props = {
  words: FlashcardWord[];
  initialAnswers?: Record<string, boolean>;
  onAnswer: (wordId: string, selectedWordId: string) => Promise<void>;
  onComplete: () => Promise<void>;
  isCompleting?: boolean;
  continueLabel?: string;
};

export function MatchingRound({ words, initialAnswers = {}, onAnswer, onComplete, isCompleting, continueLabel = "Continue practice" }: Props) {
  const seed = words.map(word => word.id).join("|");
  const left = useMemo(() => shuffleExercise(words, seed + "-words"), [words, seed]);
  const right = useMemo(() => {
    const shuffled = shuffleExercise(words, seed + "-meanings");
    // Avoid an entirely solved-looking board, even with small word sets.
    return shuffled.every((word, i) => word.id === left[i]?.id) ? [...shuffled.slice(1), shuffled[0]] : shuffled;
  }, [words, seed, left]);
  const [results, setResults] = useState<Record<string, boolean>>(() => ({ ...initialAnswers }));
  const [matched, setMatched] = useState(() => new Set(Object.keys(initialAnswers)));
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reaction, setReaction] = useState<EncouragementEvent | null>(null);
  const [lastWord, setLastWord] = useState<FlashcardWord | null>(null);
  const reactionCount = useRef(0);
  const run = useRef(0);
  const busy = useRef(false);
  const selection = useRef<{ word: string | null; meaning: string | null }>({ word: null, meaning: null });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targets = useRef(new Map<string, HTMLButtonElement>());
  const continueButton = useRef<HTMLButtonElement>(null);
  const focusFrame = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
  }, []);
  const complete = matched.size === words.length;

  async function choose(side: "word" | "meaning", id: string) {
    if (busy.current || matched.has(id) || isCompleting) return;
    setError(null);
    const a = side === "word" ? selection.current.word === id ? null : id : selection.current.word;
    const b = side === "meaning" ? selection.current.meaning === id ? null : id : selection.current.meaning;
    selection.current = { word: a, meaning: b };
    setSelectedLeft(a); setSelectedRight(b);
    if (!a || !b) return;
    busy.current = true;
    setSaving(true);
    const correct = a === b;
    try {
      // Save the first attempt only. A later repair never erases a mistake.
      if (!(a in results)) {
        await onAnswer(a, b);
        setResults(previous => ({ ...previous, [a]: correct }));
      }
      if (correct) {
        setMatched(previous => new Set([...previous, a]));
        setSelectedLeft(null); setSelectedRight(null);
        selection.current = { word: null, meaning: null };
        const word = words.find(item => item.id === a)!;
        const recovered = results[a] === false;
        run.current = recovered ? 0 : run.current + 1;
        reactionCount.current++;
        setLastWord(word);
        setReaction({ id: `${a}-${reactionCount.current}`, outcome: matched.size + 1 === words.length ? "complete" : recovered ? "recovered" : "correct", turn: reactionCount.current, streak: run.current });
        busy.current = false;
        const next = left.find(word => word.id !== a && !matched.has(word.id));
        focusFrame.current = requestAnimationFrame(() => {
          if (next) targets.current.get(next.id)?.focus();
          else continueButton.current?.focus();
        });
      } else {
        setWrong(true);
        run.current = 0;
        reactionCount.current++;
        setLastWord(null);
        setReaction({ id: `${a}-${reactionCount.current}`, outcome: "retry", turn: reactionCount.current });
        timer.current = setTimeout(() => {
          setWrong(false); setSelectedLeft(null); setSelectedRight(null); busy.current = false;
          selection.current = { word: null, meaning: null };
          focusFrame.current = requestAnimationFrame(() => targets.current.get(a)?.focus());
        }, 650);
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Couldn’t save this pair. Select it again to retry.");
      setSelectedLeft(null); setSelectedRight(null); busy.current = false;
      selection.current = { word: null, meaning: null };
    } finally {
      setSaving(false);
    }
  }

  function tile(word: FlashcardWord, side: "word" | "meaning") {
    const selected = side === "word" ? selectedLeft === word.id : selectedRight === word.id;
    const done = matched.has(word.id);
    return <button type="button" ref={side === "word" ? element => { if (element) targets.current.set(word.id, element); else targets.current.delete(word.id); } : undefined}
      className={"matching-tile" + (selected ? wrong ? " is-wrong" : " is-selected" : "") + (done ? " is-matched" : "")}
      aria-pressed={selected} aria-label={`${side === "word" ? word.word : word.meaning + ". " + (word.amharic ?? "Amharic translation unavailable")}${done ? results[word.id] ? ", matched" : ", saved for review" : ""}`}
      disabled={done || saving || wrong || isCompleting} onClick={() => void choose(side, word.id)}>
      <span>{side === "word" ? <strong>{word.word}</strong> : <><strong>{word.meaning}</strong><span lang="am">{word.amharic ?? "Translation unavailable"}</span></>}</span>
      {done && (results[word.id] ? <Check size={17} aria-hidden="true" /> : <X size={17} aria-hidden="true" />)}
    </button>;
  }

  return <section className="matching-round" aria-label="Match words with their meanings">
    <div className="matching-coach" role="status" aria-live="polite" aria-atomic="true">
      {saving ? <p className="matching-feedback"><LoaderCircle size={17} className="study-spinner" aria-hidden="true" />Saving your answer…</p> : !error && <TeacherFeedback event={reaction ?? { id: "matching-ready", outcome: complete ? "complete" : "ready", turn: 0 }} animate={reaction !== null}>
        {lastWord && <><p>{lastWord.word} — {lastWord.meaning}</p><p lang="am">{lastWord.amharic ?? "Translation unavailable"}</p></>}
      </TeacherFeedback>}
    </div>
    <div className="matching-instructions"><p>Tap one on each side to make a pair.</p><span>{matched.size} / {words.length} pairs</span></div>
    <div className="matching-board" role="group" aria-label="Word and meaning pairs">
      <span className="matching-column-label">Words</span><span className="matching-column-label">English · Amharic</span>
      {left.map((word, index) => <Fragment key={word.id}>{tile(word, "word")}{tile(right[index], "meaning")}</Fragment>)}
    </div>
    {error && <p className="study-error" role="alert">{error}</p>}
    <div className="matching-footer"><p>First answers count. Missed words stay in review.</p><button ref={continueButton} type="button" className="study-primary" disabled={!complete || saving || isCompleting} onClick={() => void onComplete()}>{isCompleting ? <LoaderCircle size={18} className="study-spinner" aria-label="Saving practice" /> : <>{continueLabel}<ArrowRight size={18} aria-hidden="true" /></>}</button></div>
  </section>;
}
