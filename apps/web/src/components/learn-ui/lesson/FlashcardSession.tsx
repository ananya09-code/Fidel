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
  onBack?: () => void;
  onComplete?: (words: FlashcardWord[]) => void;
};

const WORD_LIMITS = [5, 10, 15, 20];

export function FlashcardSession({
  category = "Everyday words",
  words = [],
  initialWordLimit = 10,
  onBack,
  onComplete,
}: FlashcardSessionProps) {
  const availableWords = words;

  const [wordLimit, setWordLimit] = useState(() =>
    Math.min(initialWordLimit, availableWords.length),
  );

  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const sessionWords = availableWords.slice(0, wordLimit);
  const currentWord = sessionWords[currentIndex];

  function startSession() {
    if (sessionWords.length === 0) return;

    setCurrentIndex(0);
    setSessionCompleted(false);
    setSessionStarted(true);
  }

  function goBackToSetup() {
    setSessionStarted(false);
    setSessionCompleted(false);
    setCurrentIndex(0);
  }

  function handleNext() {
    setCurrentIndex((index) =>
      Math.min(index + 1, sessionWords.length - 1),
    );
  }

  function handlePrevious() {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  function finishSession() {
    setSessionCompleted(true);
  }

  function handlePractice() {
    onComplete?.(sessionWords);
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
        <div className="rounded-3xl border border-border bg-card px-6 py-12 text-center sm:px-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>

          <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
            No words yet
          </h2>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            There are no vocabulary words available for this lesson yet. Try
            another lesson or come back later.
          </p>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
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
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="px-6 py-12 text-center sm:px-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Session completed
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Great work!
            </h2>

            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-muted-foreground">
              You explored{" "}
              <span className="font-semibold text-foreground">
                {sessionWords.length}{" "}
                {sessionWords.length === 1 ? "word" : "words"}
              </span>{" "}
              in {category}. Keep going to make them part of your vocabulary.
            </p>

            <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-2xl font-bold text-foreground">
                  {sessionWords.length}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Words explored
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-2xl font-bold text-foreground">100%</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cards completed
                </p>
              </div>
            </div>

            <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
              <button
                type="button"
                onClick={handlePractice}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Continue to practice
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={startSession}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4" />
                Review these words again
              </button>

              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="mt-1 min-h-11 rounded-xl px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Back to lessons
                </button>
              )}
            </div>
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
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit session
          </button>

          <span className="max-w-[55%] truncate rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {category}
          </span>
        </div>

        <Flashcard
          key={currentWord.id}
          word={currentWord}
          currentIndex={currentIndex}
          total={sessionWords.length}
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
        className="mb-8 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to lessons
      </button>

      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <BookOpen className="h-7 w-7 text-primary" />
        </div>

        <p className="mt-6 text-sm font-semibold text-primary">
          YOUR NEXT LEARNING SESSION
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {category}
        </h1>

        <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
          Learn each word, reveal its meaning, and listen to its pronunciation
          when audio is available. Choose how many words you want to explore.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-background p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">
                Words in this session
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {availableWords.length}{" "}
                {availableWords.length === 1 ? "word available" : "words available"}
              </p>
            </div>

            <span className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
              {Math.min(wordLimit, availableWords.length)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {WORD_LIMITS.map((limit) => {
              const disabled = limit > availableWords.length;
              const selected = wordLimit === limit;

              return (
                <button
                  key={limit}
                  type="button"
                  disabled={disabled}
                  onClick={() => setWordLimit(limit)}
                  className={[
                    "min-h-12 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-muted",
                    disabled ? "cursor-not-allowed opacity-35" : "",
                  ].join(" ")}
                >
                  {limit} words
                </button>
              );
            })}
          </div>

          {availableWords.length < 5 && (
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              This lesson has fewer than five words, so you can learn all{" "}
              {availableWords.length} available{" "}
              {availableWords.length === 1 ? "word" : "words"}.
            </p>
          )}
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={startSession}
            disabled={sessionWords.length === 0}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start learning
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Not now
          </button>
        </div>
      </div>
    </section>
  );
}
