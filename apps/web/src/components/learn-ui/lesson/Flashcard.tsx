import { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
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

const SWIPE_THRESHOLD = 64;
const MOTION_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Flashcard({
  word,
  currentIndex,
  total,
  direction = "next",
  onPrevious,
  onNext,
  onFinish,
}: FlashcardProps) {
  const [audioError, setAudioError] = useState<string | null>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const isMoving = useRef(false);
  const previousWord = useRef(word.id);
  const previousHeight = useRef<number | null>(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    const card = cardRef.current;
    const changed = previousWord.current !== word.id;
    previousWord.current = word.id;
    isMoving.current = false;

    if (changed && content && card && !prefersReducedMotion()) {
      isMoving.current = true;
      const entry = content.animate(
        [
          { transform: `translate3d(${direction === "previous" ? -20 : 20}px, 0, 0)`, opacity: 0 },
          { transform: "translate3d(0, 0, 0)", opacity: 1 },
        ],
        { duration: 220, easing: MOTION_EASING },
      );
      animations.current.push(entry);
      if (previousHeight.current !== null) {
        const height = card.getBoundingClientRect().height;
        if (Math.abs(height - previousHeight.current) > 1) {
          animations.current.push(card.animate(
            [{ height: `${previousHeight.current}px` }, { height: `${height}px` }],
            { duration: 220, easing: MOTION_EASING },
          ));
        }
      }
      void entry.finished.then(() => { isMoving.current = false; }).catch(() => {});
    }
    previousHeight.current = null;

    return () => {
      animations.current.forEach((animation) => animation.cancel());
      animations.current = [];
      isMoving.current = false;
    };
  }, [word.id, direction]);

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  function playAudio() {
    if (!word.audioUrl) return;

    setAudioError(null);

    const audio = new Audio(word.audioUrl);

    audio.play().catch(() => {
      setAudioError(word.id);
    });
  }

  function moveTo(target: "next" | "previous") {
    setDragX(0);
    setIsDragging(false);
    setAudioError(null);
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
      return;
    }

    onPrevious();
  }

  function navigate(target: "next" | "previous") {
    if (isMoving.current) return;
    if (target === "previous" && isFirst) {
      setDragX(0);
      return;
    }
    const content = contentRef.current;
    if (!content || prefersReducedMotion()) {
      moveTo(target);
      return;
    }
    isMoving.current = true;
    previousHeight.current = cardRef.current?.getBoundingClientRect().height ?? null;
    const distance = Math.max(24, Math.abs(dragX * 0.25) + 16);
    const exit = content.animate(
      [{}, { transform: `translate3d(${target === "next" ? -distance : distance}px, 0, 0)`, opacity: 0 }],
      { duration: 120, easing: "ease-out", fill: "forwards" },
    );
    animations.current.push(exit);
    // Cancelled animations must never advance a session after leaving the page.
    void exit.finished.then(() => moveTo(target)).catch(() => {});
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (isMoving.current) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    startX.current = event.clientX;
    startY.current = event.clientY;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || isMoving.current) return;

    const deltaX = event.clientX - startX.current;
    const deltaY = event.clientY - startY.current;
    if (Math.abs(deltaY) > 12 && Math.abs(deltaY) > Math.abs(deltaX)) {
      cancelDrag();
      return;
    }

    setDragX(Math.max(-240, Math.min(240, deltaX)));
  }

  function finishDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;

    const delta = event.clientX - startX.current;

    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (Math.abs(delta) < SWIPE_THRESHOLD) {
      setDragX(0);
      return;
    }

    const goingNext = delta < 0;

    if (!goingNext && isFirst) {
      setDragX(0);
      return;
    }

    navigate(goingNext ? "next" : "previous");
  }

  function cancelDrag() {
    if (isMoving.current) return;

    setIsDragging(false);
    setDragX(0);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    // Held keys should not scroll the page while a card is transitioning.
    event.preventDefault();
    if (isMoving.current) return;
    navigate(event.key === "ArrowRight" ? "next" : "previous");
  }

  return (
    <section className="mx-auto w-full max-w-2xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-[var(--sea-ink)]/55">
            Your vocabulary
          </span>

          <span className="text-sm font-semibold tabular-nums text-[var(--sea-ink)]">
            {currentIndex + 1} of {total}
          </span>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-[var(--sea-ink)]/5"
          role="progressbar"
          aria-label="Flashcard progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={currentIndex + 1}
        >
          <div
            className="h-full rounded-full bg-[#E9A23B] transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Swipeable flashcard */}
      <div>
        <div
          ref={cardRef}
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
            "bg-[var(--panel)]/60 px-6 py-10 text-center backdrop-blur sm:min-h-[410px] sm:px-12",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E9A23B]/30",
            isDragging ? "cursor-grabbing" : "cursor-grab",
          ].join(" ")}
          style={{
            touchAction: "pan-y",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden="true"
          >
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#E9A23B]/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#7C83FD]/10 blur-3xl" />
          </div>

          <div
            ref={contentRef}
            className="relative z-10 flex w-full flex-col items-center motion-reduce:!transition-none"
            style={{
              transform: `translate3d(${dragX * 0.25}px, 0, 0)`,
              transition: isDragging ? "none" : `transform 220ms ${MOTION_EASING}`,
            }}
          >
            <span className="mb-8 rounded-full border border-[var(--sea-ink)]/10 bg-[var(--panel)]/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sea-ink)]/55">
              Learn this word
            </span>

            <h2 className="break-words text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
              {word.word}
            </h2>

            {word.transliteration && (
              <p className="mt-4 text-base text-[var(--sea-ink)]/55 sm:text-lg">
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
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--sea-ink)]/10 bg-[var(--panel)]/70 px-4 py-2 text-sm font-medium text-[var(--sea-ink)] transition-colors hover:bg-[var(--panel)]"
              >
                <Volume2 className="h-4 w-4" />
                Listen to pronunciation
              </button>
            )}

            {audioError === word.id && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-300" role="alert">
                Audio could not be played. Please try again.
              </p>
            )}

            {!word.audioUrl && (
              <span className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--sea-ink)]/55">
                <Headphones className="h-4 w-4" />
                Pronunciation unavailable
              </span>
            )}

            <div className="mt-8 grid w-full gap-3 text-left sm:grid-cols-2">
              <div className="rounded-2xl border border-[#E9A23B]/30 bg-[#E9A23B]/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9A6515] dark:text-amber-300">
                  Amharic
                </p>
                <p className="mt-1 break-words text-lg font-semibold text-[var(--sea-ink)]">
                  {word.amharic ?? "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-[#39C987]/30 bg-[#39C987]/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#239B65] dark:text-emerald-300">
                  English
                </p>
                <p className="mt-1 break-words text-lg font-semibold text-[var(--sea-ink)]">
                  {word.meaning}
                </p>
              </div>
            </div>

            {word.example && (
              <div className="mt-4 w-full rounded-2xl border border-[var(--sea-ink)]/10 bg-[var(--panel)]/70 p-4 text-left">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink)]/50">
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

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("previous")}
          disabled={isFirst}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--sea-ink)]/10 bg-[var(--panel)]/60 px-4 py-2 text-sm font-medium text-[var(--sea-ink)] transition-colors hover:bg-[var(--panel)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          type="button"
          onClick={() => navigate("next")}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--action)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {isLast ? "Finish session" : "Next word"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Swipe hint */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[var(--sea-ink)]/55">
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
