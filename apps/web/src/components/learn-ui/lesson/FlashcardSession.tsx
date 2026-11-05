import { useState } from "react";
import { ArrowLeft, ArrowRight, LoaderCircle, RotateCcw } from "lucide-react";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import { PageState } from "@/components/common-ui/PageState";
import { topicLabel } from "@/components/homepage-ui/labels";
import "./lesson.css";

import { Flashcard } from "@/components/learn-ui/lesson/Flashcard";
import type { FlashcardWord } from "@/components/learn-ui/lesson/Flashcard";

type FlashcardSessionProps = {
  category?: string;
  words?: FlashcardWord[];
  initialWordLimit?: number;
  resumeActive?: boolean;
  resumeFromIndex?: number;
  onBack?: () => void;
  onStart?: (questionCount: number) => Promise<void>;
  onProgress?: (questionIndex: number) => Promise<void> | void;
  onComplete?: (words: FlashcardWord[]) => Promise<void> | void;
};

const WORD_LIMITS = [5, 10, 15, 20];

export function FlashcardSession({
  category = "Everyday words",
  words = [],
  initialWordLimit = 10,
  resumeActive = false,
  resumeFromIndex = 0,
  onBack,
  onStart,
  onProgress,
  onComplete,
}: FlashcardSessionProps) {
  const availableWords = words;

  const [wordLimit, setWordLimit] = useState(() =>
    Math.min(initialWordLimit, availableWords.length),
  );

  const [sessionStarted, setSessionStarted] = useState(resumeActive);
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.min(resumeFromIndex, Math.max(availableWords.length - 1, 0)),
  );
  const [sessionCompleted, setSessionCompleted] = useState(
    resumeActive && resumeFromIndex >= Math.min(initialWordLimit, availableWords.length),
  );
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const sessionWords = availableWords.slice(0, wordLimit);
  const currentWord = sessionWords[currentIndex];
  const wordLimitOptions = Array.from(
    new Set([
      ...WORD_LIMITS.filter((limit) => limit <= availableWords.length),
      Math.min(availableWords.length, 20),
      wordLimit,
    ]),
  ).sort((first, second) => first - second);

  async function startSession() {
    if (sessionWords.length === 0) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onStart?.(sessionWords.length);
      setCurrentIndex(0);
      setSessionCompleted(false);
      setDirection("next");
      setSessionStarted(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to start this lesson.");
    } finally {
      setIsSaving(false);
    }
  }

  function goBackToSetup() {
    setSessionStarted(false);
    setSessionCompleted(false);
    setCurrentIndex(0);
  }

  function handleNext() {
    setDirection("next");
    const nextIndex = Math.min(currentIndex + 1, sessionWords.length - 1);
    setCurrentIndex(nextIndex);
    void Promise.resolve(onProgress?.(nextIndex)).catch((error: unknown) => {
      setSaveError(error instanceof Error ? error.message : "Unable to save your place.");
    });
  }

  function handlePrevious() {
    setDirection("previous");
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  async function finishSession() {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onProgress?.(sessionWords.length);
      setSessionCompleted(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save your place.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePractice() {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onComplete?.(sessionWords);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save lesson progress.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleBack() {
    if (sessionStarted && !sessionCompleted) {
      goBackToSetup();
      return;
    }

    onBack?.();
  }


  const errorNotice = saveError && <p className="study-error" role="alert">{saveError}</p>;
  const busy = <LoaderCircle size={18} className="study-spinner" aria-hidden="true" />;

  if (availableWords.length === 0) {
    return <div className="fidel-study"><PageState kind="empty" title="No words yet" description="Try another lesson while vocabulary is being prepared." actionLabel="Back to lessons" onAction={onBack} /></div>;
  }

  if (sessionCompleted) {
    return <div className="fidel-study">
      <section className="study-milestone">
        <FidelTeacherMark className="study-teacher" />
        <h1>Words met. Time to practise.</h1>
        <p>You explored {sessionWords.length} {sessionWords.length === 1 ? "word" : "words"} in {topicLabel(category)}. Now see what you remember.</p>
        <div className="study-milestone-actions">
          <button type="button" className="study-primary" disabled={isSaving} onClick={() => void handlePractice()}>{isSaving ? busy : <ArrowRight size={18} aria-hidden="true" />}Continue to practice</button>
          <button type="button" className="study-secondary" disabled={isSaving} onClick={() => { setCurrentIndex(0); setSessionCompleted(false); }}><RotateCcw size={16} aria-hidden="true" />Look through the cards again</button>
          <button type="button" className="study-text-button" disabled={isSaving} onClick={onBack}>Back to lessons</button>
        </div>
        {errorNotice}
      </section>
    </div>;
  }

  if (sessionStarted && currentWord) {
    return <div className="fidel-study">
      <header className="study-header"><button type="button" className="study-text-button" onClick={handleBack}><ArrowLeft size={18} aria-hidden="true" />Exit session</button><h1>{topicLabel(category)}</h1></header>
      <Flashcard word={currentWord} currentIndex={currentIndex} total={sessionWords.length} direction={direction} onPrevious={handlePrevious} onNext={handleNext} onFinish={() => void finishSession()} />
      {isSaving && <p role="status" className="study-saving">{busy}<span className="sr-only">Saving progress</span></p>}
      {errorNotice}
    </div>;
  }

  return <div className="fidel-study">
    <header className="study-header"><button type="button" className="study-text-button" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" />Back to lessons</button><span>Vocabulary</span></header>
    <section className="study-setup">
      <FidelTeacherMark className="study-teacher" />
      <h1>{topicLabel(category)}</h1>
      <p>Meet the words, hear how they sound, then put your memory to work.</p>
      <fieldset className="study-word-limit">
        <legend>Words in this session</legend>
        <p>{availableWords.length} {availableWords.length === 1 ? "word" : "words"} available</p>
        <div className="study-limit-options">{wordLimitOptions.filter((limit) => limit > 0).map((limit) => <button type="button" key={limit} aria-pressed={wordLimit === limit} disabled={isSaving} onClick={() => setWordLimit(limit)}><span>{limit}</span> {limit === 1 ? "word" : "words"}</button>)}</div>
      </fieldset>
      <button type="button" className="study-primary" disabled={!sessionWords.length || isSaving} onClick={() => void startSession()}>{isSaving ? busy : <ArrowRight size={18} aria-hidden="true" />}Start learning</button>
      {errorNotice}
    </section>
  </div>;
}
