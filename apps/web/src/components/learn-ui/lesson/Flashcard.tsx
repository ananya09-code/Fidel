import { useRef, useState } from "react";
import {
  ArrowLeftRight,
  Headphones,
  Volume2,
} from "lucide-react";

export type FlashcardWord = {
  id: string;
  word: string;
  transliteration?: string | null;
  meaning: string;
  amharic?: string | null;
  example?: string | null;
  audioUrl?: string | null;
};

type FlashcardProps = {
  word: FlashcardWord;
  currentIndex: number;
  total: number;
  direction?: "next" | "previous";
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
};

const SWIPE_THRESHOLD = 90;
const EXIT_DURATION = 240;

export function Flashcard({
  word,
  currentIndex,
  total,
  direction = "next",
  onPrevious,
  onNext,
  onFinish,
}: FlashcardProps) {
  const [audioError, setAudioError] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const startX = useRef(0);

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  function playAudio() {
    if (!word.audioUrl) return;

    setAudioError(false);

    const audio = new Audio(word.audioUrl);

    audio.play().catch(() => {
      setAudioError(true);
    });
  }

  function moveTo(target: "next" | "previous") {
    if (target === "next") {
      if (isLast) {
        onFinish();
        return;
      }
      onNext();
      return;
    }

    if (isFirst) {
      setDragX(0);
      setIsExiting(false);
      return;
    }

    onPrevious();
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (isExiting) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    startX.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || isExiting) return;

    setDragX(event.clientX - startX.current);
  }

  function finishDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;

    const delta = event.clientX - startX.current;

    setIsDragging(false);

    if (Math.abs(delta) < SWIPE_THRESHOLD) {
      setDragX(0);
      return;
    }

    const goingNext = delta < 0;

    if (!goingNext && isFirst) {
      setDragX(0);
      return;
    }

    setIsExiting(true);
    setDragX(goingNext ? -window.innerWidth : window.innerWidth);

    window.setTimeout(() => {
      moveTo(goingNext ? "next" : "previous");
    }, EXIT_DURATION);
  }

  function cancelDrag() {
    if (isExiting) return;

    setIsDragging(false);
    setDragX(0);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (isExiting) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setIsExiting(true);
      setDragX(-window.innerWidth);
      window.setTimeout(() => moveTo("next"), EXIT_DURATION);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setIsExiting(true);
      setDragX(window.innerWidth);
      window.setTimeout(() => moveTo("previous"), EXIT_DURATION);
    }
  }

  const rotation = dragX * 0.03;
  const dragOpacity = 1 - Math.min(Math.abs(dragX) / 900, 0.35);

  return (
    <section className="mx-auto w-full max-w-2xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Your vocabulary
          </span>

          <span className="text-sm font-semibold tabular-nums text-[var(--sea-ink)]">
            {currentIndex + 1} of {total}
          </span>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-black/5"
          role="progressbar"
          aria-label="Flashcard progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={currentIndex + 1}
        >
          <div
            className="h-full rounded-full bg-[#E9A23B] transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Swipeable flashcard */}
      <div className={direction === "previous" ? "slide-in-prev" : "slide-in-next"}>
        <div
          role="group"
          tabIndex={0}
          aria-roledescription="swipeable flashcard"
          aria-label={`${word.word}. Swipe or use the arrow keys to move between words.`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={cancelDrag}
          onKeyDown={handleKeyDown}
          className={[
            "relative flex min-h-[350px] select-none flex-col items-center justify-center",
            "overflow-hidden rounded-[2rem] border border-[var(--sea-ink)]/10",
            "bg-white/60 px-6 py-10 text-center backdrop-blur sm:min-h-[410px] sm:px-12",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E9A23B]/30",
            isDragging ? "cursor-grabbing" : "cursor-grab",
          ].join(" ")}
          style={{
            touchAction: "pan-y",
            transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
            opacity: isExiting ? 0 : dragOpacity,
            transition: isDragging
              ? "none"
              : `transform ${EXIT_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${EXIT_DURATION}ms ease`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden="true"
          >
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#E9A23B]/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#7C83FD]/10 blur-3xl" />
          </div>

          <div className="relative z-10 flex w-full flex-col items-center">
            <span className="mb-8 rounded-full border border-[var(--sea-ink)]/10 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Learn this word
            </span>

            <h2 className="break-words text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
              {word.word}
            </h2>

            {word.transliteration && (
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                {word.transliteration}
              </p>
            )}

            {word.audioUrl && (
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  playAudio();
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--sea-ink)]/10 bg-white/70 px-4 py-2 text-sm font-medium text-[var(--sea-ink)] transition-colors hover:bg-white"
              >
                <Volume2 className="h-4 w-4" />
                Listen to pronunciation
              </button>
            )}

            {audioError && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                Audio could not be played. Please try again.
              </p>
            )}

            {!word.audioUrl && (
              <span className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Headphones className="h-4 w-4" />
                Pronunciation unavailable
              </span>
            )}

            <div className="mt-8 grid w-full gap-3 text-left sm:grid-cols-2">
              <div className="rounded-2xl border border-[#E9A23B]/30 bg-[#E9A23B]/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9A6515]">
                  Amharic
                </p>
                <p className="mt-1 break-words text-lg font-semibold text-[var(--sea-ink)]">
                  {word.amharic ?? "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-[#39C987]/30 bg-[#39C987]/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#239B65]">
                  English
                </p>
                <p className="mt-1 break-words text-lg font-semibold text-[var(--sea-ink)]">
                  {word.meaning}
                </p>
              </div>
            </div>

            {word.example && (
              <div className="mt-4 w-full rounded-2xl border border-[var(--sea-ink)]/10 bg-white/70 p-4 text-left">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Example
                </p>

                <p className="text-sm leading-6 text-[var(--sea-ink)]/80 sm:text-base">
                  {word.example}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Swipe hint */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <ArrowLeftRight className="h-4 w-4" />
        {isLast
          ? "Swipe left to finish"
          : isFirst
            ? "Swipe left for the next word"
            : "Swipe left or right to move between words"}
      </div>
    </section>
  );
}
