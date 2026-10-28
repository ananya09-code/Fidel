import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Headphones,
  RotateCcw,
  Volume2,
} from "lucide-react";

export type FlashcardWord = {
  id: string;
  word: string;
  transliteration?: string | null;
  meaning: string;
  example?: string | null;
  audioUrl?: string | null;
};

type FlashcardProps = {
  word: FlashcardWord;
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
};

export function Flashcard({
  word,
  currentIndex,
  total,
  onPrevious,
  onNext,
  onFinish,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  function goNext() {
    setIsFlipped(false);

    if (isLast) {
      onFinish();
      return;
    }

    onNext();
  }

  function goPrevious() {
    setIsFlipped(false);
    onPrevious();
  }

  function playAudio() {
    if (!word.audioUrl) return;

    setAudioError(false);

    const audio = new Audio(word.audioUrl);

    audio.play().catch(() => {
      setAudioError(true);
    });
  }

  return (
    <section className="mx-auto w-full max-w-2xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Your vocabulary
          </span>

          <span className="text-sm font-semibold tabular-nums text-foreground">
            {currentIndex + 1} of {total}
          </span>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Flashcard progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={currentIndex + 1}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <button
        type="button"
        onClick={() => setIsFlipped((previous) => !previous)}
        className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
        aria-label={
          isFlipped
            ? "Show the original word"
            : "Reveal the word's meaning"
        }
      >
        <div
          className={[
            "relative flex min-h-[350px] flex-col items-center justify-center",
            "overflow-hidden rounded-[2rem] border border-border",
            "bg-card px-6 py-10 text-center sm:min-h-[410px] sm:px-12",
            "transition-colors duration-200",
            "hover:border-primary/40",
          ].join(" ")}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            aria-hidden="true"
          >
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="relative z-10 flex w-full flex-col items-center">
            <span className="mb-8 rounded-full border border-border bg-background/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {isFlipped ? "Meaning" : "Learn this word"}
            </span>

            {!isFlipped ? (
              <>
                <h2 className="break-words text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                  {word.word}
                </h2>

                {word.transliteration && (
                  <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                    {word.transliteration}
                  </p>
                )}

                {word.audioUrl && (
                  <span
                    className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
                    onClick={(event) => {
                      event.stopPropagation();
                      playAudio();
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Play word pronunciation"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        playAudio();
                      }
                    }}
                  >
                    <Volume2 className="h-4 w-4" />
                    Listen to pronunciation
                  </span>
                )}

                {audioError && (
                  <p className="mt-3 text-sm text-destructive" role="status">
                    Audio could not be played. Please try again.
                  </p>
                )}

                {!word.audioUrl && (
                  <span className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Headphones className="h-4 w-4" />
                    Pronunciation unavailable
                  </span>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">
                  {word.word}
                </p>

                <h2 className="mt-4 break-words text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                  {word.meaning}
                </h2>

                {word.example && (
                  <div className="mt-8 max-w-md rounded-2xl border border-border bg-background/80 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Example
                    </p>

                    <p className="text-sm leading-6 text-foreground sm:text-base">
                      {word.example}
                    </p>
                  </div>
                )}
              </>
            )}

            <span className="mt-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
              <RotateCcw className="h-4 w-4" />
              {isFlipped ? "Click to see the word" : "Click to reveal meaning"}
            </span>
          </div>
        </div>
      </button>

      {/* Navigation */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={goPrevious}
          disabled={isFirst}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>

        <button
          type="button"
          onClick={goNext}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {isLast ? (
            <>
              Finish
              <Check className="h-4 w-4" />
            </>
          ) : (
            <>
              Next word
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </section>
  );
}
