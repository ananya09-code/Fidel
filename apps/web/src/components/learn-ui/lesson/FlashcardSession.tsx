import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from "lucide-react";

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
    void onProgress?.(nextIndex);
  }

  function handlePrevious() {
    setDirection("previous");
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  function finishSession() {
    setSessionCompleted(true);
    void onProgress?.(sessionWords.length);
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

  if (availableWords.length === 0) {
    return (
      <section className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="rounded-[2rem] border border-[var(--sea-ink)]/10 bg-white/60 px-6 py-12 text-center backdrop-blur sm:px-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--sand)]/45">
            <BookOpen className="h-7 w-7 text-[var(--sea-ink)]" />
          </div>

          <h2 className="mt-6 text-2xl font-bold tracking-tight text-[var(--sea-ink)]">
            No words yet
          </h2>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--sea-ink)]/60">
            There are no vocabulary words available for this lesson yet. Try
            another lesson or come back later.
          </p>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--sea-ink)]/12 bg-white/50 px-5 py-3 text-sm font-semibold text-[var(--sea-ink)] transition-colors hover:bg-[var(--sand)]/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to lessons
            </button>
          )}
        </div>
      </section>
    );
  }

  if (sessionCompleted) {
    return (
      <section className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
        <div className="overflow-hidden rounded-[2rem] border border-[var(--sea-ink)]/10 bg-white/60 backdrop-blur">
          <div className="px-6 py-12 text-center sm:px-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#39C987]/15">
              <CheckCircle2 className="h-10 w-10 text-[#239B65]" />
            </div>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[var(--sea-ink)]/10 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink)]/55">
              <Sparkles className="h-4 w-4 text-[#E9A23B]" />
              Session completed
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
              Great work!
            </h2>

            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[var(--sea-ink)]/60">
              You explored{" "}
              <span className="font-semibold text-[var(--sea-ink)]">
                {sessionWords.length}{" "}
                {sessionWords.length === 1 ? "word" : "words"}
              </span>{" "}
              in {category}. Keep going to make them part of your vocabulary.
            </p>

            <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[var(--sea-ink)]/10 bg-white/55 p-4">
                <p className="text-2xl font-bold text-[var(--sea-ink)]">
                  {sessionWords.length}
                </p>
                <p className="mt-1 text-xs text-[var(--sea-ink)]/55">
                  Words explored
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--sea-ink)]/10 bg-white/55 p-4">
                <p className="text-2xl font-bold text-[var(--sea-ink)]">100%</p>
                <p className="mt-1 text-xs text-[var(--sea-ink)]/55">
                  Cards completed
                </p>
              </div>
            </div>

            <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
              <button
                type="button"
                onClick={() => void handlePractice()}
                disabled={isSaving}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--sea-ink)] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {isSaving ? "Saving..." : "Continue to practice"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={startSession}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--sea-ink)]/12 bg-white/50 px-5 py-3 text-sm font-semibold text-[var(--sea-ink)] transition-colors hover:bg-[var(--sand)]/30"
              >
                <RotateCcw className="h-4 w-4" />
                Review these words again
              </button>

              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="mt-1 min-h-11 rounded-xl px-5 py-3 text-sm font-medium text-[var(--sea-ink)]/55 transition-colors hover:text-[var(--sea-ink)]"
                >
                  Back to lessons
                </button>
              )}
            </div>
            {saveError && <p className="mt-4 text-sm text-red-600" role="alert">{saveError}</p>}
          </div>
        </div>
      </section>
    );
  }

  if (sessionStarted && currentWord) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
        <div className="mb-7 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-[var(--sea-ink)]/60 transition-colors hover:text-[var(--sea-ink)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit session
          </button>

          <span className="max-w-[55%] truncate rounded-full border border-[var(--sea-ink)]/10 bg-white/60 px-3 py-1.5 text-xs font-medium text-[var(--sea-ink)]/60">
            {category}
          </span>
        </div>

        <Flashcard
          key={currentWord.id}
          word={currentWord}
          currentIndex={currentIndex}
          total={sessionWords.length}
          direction={direction}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onFinish={finishSession}
        />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-[var(--sea-ink)]/60 transition-colors hover:text-[var(--sea-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to lessons
      </button>

      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--sea-ink)]/10 bg-white/60 p-6 backdrop-blur sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#E9A23B]/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#7C83FD]/10 blur-3xl" aria-hidden="true" />

        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--sand)]/45">
          <BookOpen className="h-7 w-7 text-[var(--sea-ink)]" />
        </div>

        <p className="relative mt-6 text-sm font-semibold text-[#9A6515]">
          YOUR NEXT LEARNING SESSION
        </p>

        <h1 className="relative mt-3 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          {category}
        </h1>

        <p className="relative mt-4 max-w-lg text-sm leading-6 text-[var(--sea-ink)]/60 sm:text-base">
          Learn each word, reveal its meaning, and listen to its pronunciation
          when audio is available. Choose how many words you want to explore.
        </p>

        <div className="relative mt-8 rounded-2xl border border-[var(--sea-ink)]/10 bg-white/55 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-[var(--sea-ink)]">
                Words in this session
              </h2>

              <p className="mt-1 text-sm text-[var(--sea-ink)]/55">
                {availableWords.length}{" "}
                {availableWords.length === 1 ? "word available" : "words available"}
              </p>
            </div>

            <span className="rounded-xl bg-[#E9A23B]/15 px-3 py-2 text-sm font-bold text-[#9A6515]">
              {Math.min(wordLimit, availableWords.length)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {wordLimitOptions.map((limit) => {
              const selected = wordLimit === limit;

              return (
                <button
                  key={limit}
                  type="button"
                  onClick={() => setWordLimit(limit)}
                  aria-pressed={selected}
                  className={[
                    "flex min-h-20 flex-col items-center justify-center rounded-2xl border px-3 py-3 transition-all",
                    selected
                      ? "border-[#E9A23B] bg-[#E9A23B]/15 text-[#7A4E0E] shadow-sm"
                      : "border-[var(--sea-ink)]/10 bg-white/65 text-[var(--sea-ink)] hover:border-[var(--sea-ink)]/20 hover:bg-[var(--sand)]/25",
                  ].join(" ")}
                >
                  <span className="text-2xl font-bold tabular-nums">{limit}</span>
                  <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider opacity-65">
                    {limit === 1 ? "word" : "words"}
                  </span>
                </button>
              );
            })}
          </div>

          {availableWords.length < 5 && (
            <p className="mt-4 text-xs leading-5 text-[var(--sea-ink)]/55">
              This lesson has fewer than five words, so you can learn all{" "}
              {availableWords.length} available{" "}
              {availableWords.length === 1 ? "word" : "words"}.
            </p>
          )}
        </div>

        <div className="relative mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void startSession()}
            disabled={sessionWords.length === 0 || isSaving}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--sea-ink)] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Starting..." : "Start learning"}
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--sea-ink)]/12 bg-white/50 px-5 py-3 text-sm font-semibold text-[var(--sea-ink)] transition-colors hover:bg-[var(--sand)]/30"
          >
            Not now
          </button>
        </div>
        {saveError && <p className="mt-4 text-sm text-red-600" role="alert">{saveError}</p>}
      </div>
    </section>
  );
}
