
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  Flashcard,
  type FlashcardWord,
} from "./Flashcard";

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
  const [wordLimit, setWordLimit] = useState(initialWordLimit);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const sessionWords = words.slice(0, wordLimit);
  const currentWord = sessionWords[currentIndex];

  function finishSession() {
    setCompleted(true);
  }

  if (!started) {
    return (
      <section className="mx-auto w-full max-w-xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--sea-ink)]/70 hover:text-[var(--sea-ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to learning
        </button>

        <div className="rounded-3xl border border-[var(--sea-ink)]/10 bg-white/80 p-6 sm:p-8">
          <p className="text-sm font-semibold text-[var(--sea-ink)]/60">
            YOUR LEARNING SESSION
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[var(--sea-ink)]">
            {category}
          </h1>

          <p className="mt-3 leading-relaxed text-[var(--sea-ink)]/70">
            Learn each word, see its meaning, and listen to its pronunciation.
            Then practise what you remember.
          </p>

          <h2 className="mt-8 text-base font-semibold text-[var(--sea-ink)]">
            How many words would you like to learn?
          </h2>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {WORD_LIMITS.map((limit) => {
              const available = Math.min(limit, words.length);

              return (
                <button
                  key={limit}
                  type="button"
                  disabled={available === 0}
                  onClick={() => setWordLimit(limit)}
                  className={[
                    "rounded-xl border px-2 py-4 text-center transition",
                    wordLimit === limit
                      ? "border-[var(--sea-ink)] bg-[var(--sea-ink)] text-white"
                      : "border-[var(--sea-ink)]/15 text-[var(--sea-ink)] hover:bg-[var(--sea-ink)]/5",
                    available === 0 ? "cursor-not-allowed opacity-40" : "",
                  ].join(" ")}
                >
                  <span className="block text-lg font-bold">{limit}</span>
                  <span className="mt-1 block text-xs opacity-75">
                    words
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-sm text-[var(--sea-ink)]/55">
            {words.length === 0
              ? "No words are available in this session yet."
              : `${Math.min(wordLimit, words.length)} words available for this session.`}
          </p>

          <button
            type="button"
            disabled={words.length === 0}
            onClick={() => setStarted(true)}
            className="mt-7 min-h-12 w-full rounded-xl bg-[var(--sea-ink)] px-5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start learning
          </button>
        </div>
      </section>
    );
  }

  if (completed) {
    return (
      <section className="mx-auto w-full max-w-xl rounded-3xl border border-[var(--sea-ink)]/10 bg-white/80 p-8 text-center sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sea-ink)]/10 text-[var(--sea-ink)]">
          <span className="text-2xl">✓</span>
        </div>

        <h1 className="mt-5 text-2xl font-bold text-[var(--sea-ink)] sm:text-3xl">
          You explored all {sessionWords.length} words!
        </h1>

        <p className="mt-3 leading-relaxed text-[var(--sea-ink)]/70">
          Now let’s see what you remember.
        </p>

        <button
          type="button"
          onClick={() => onComplete?.(sessionWords)}
          className="mt-7 min-h-12 w-full rounded-xl bg-[var(--sea-ink)] px-5 font-semibold text-white transition hover:opacity-90"
        >
          Start practice
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentIndex(0);
            setCompleted(false);
          }}
          className="mt-3 min-h-11 w-full rounded-xl border border-[var(--sea-ink)]/15 px-5 font-medium text-[var(--sea-ink)] hover:bg-[var(--sea-ink)]/5"
        >
          Review words again
        </button>
      </section>
    );
  }

  if (!currentWord) return null;

  return (
    <section className="mx-auto w-full max-w-xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--sea-ink)]/70 hover:text-[var(--sea-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Exit session
      </button>

      <Flashcard
        word={currentWord}
        currentIndex={currentIndex}
        total={sessionWords.length}
        onPrevious={() => {
          setCurrentIndex((index) => Math.max(0, index - 1));
        }}
        onNext={() => {
          setCurrentIndex((index) =>
            Math.min(sessionWords.length - 1, index + 1),
          );
        }}
        onFinish={finishSession}
      />
    </section>
  );
}

