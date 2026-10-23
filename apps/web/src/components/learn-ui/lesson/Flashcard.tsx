
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Headphones,
  LoaderCircle,
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
  onFinish?: () => void;
};

export function Flashcard({
  word,
  currentIndex,
  total,
  onPrevious,
  onNext,
  onFinish,
}: FlashcardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pointerStartX = useRef<number | null>(null);

  const isLastCard = currentIndex === total - 1;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  useEffect(() => {
    setIsPlaying(false);
    setAudioError(false);
    setDragX(0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [word.id]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  async function playAudio() {
    if (!word.audioUrl || isPlaying) return;

    setAudioError(false);

    const audio = new Audio(word.audioUrl);
    audioRef.current?.pause();
    audioRef.current = audio;

    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      setAudioError(true);
    };

    try {
      setIsPlaying(true);
      await audio.play();
    } catch {
      setIsPlaying(false);
      setAudioError(true);
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;

    pointerStartX.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null) return;

    setDragX(event.clientX - pointerStartX.current);
  }

  function handlePointerUp() {
    if (pointerStartX.current === null) return;

    const distance = dragX;

    pointerStartX.current = null;
    setIsDragging(false);
    setDragX(0);

    if (distance < -70) {
      if (isLastCard) {
        onFinish?.();
      } else {
        onNext();
      }
    } else if (distance > 70) {
      onPrevious();
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-[var(--sea-ink)]/65">
          Word {currentIndex + 1} of {total}
        </span>

        <span className="text-sm font-semibold text-[var(--sea-ink)]">
          {Math.round(progress)}% explored
        </span>
      </div>

      <div
        className="mb-7 h-2 overflow-hidden rounded-full bg-[var(--sea-ink)]/10"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="Flashcard progress"
      >
        <div
          className="h-full rounded-full bg-[var(--sea-ink)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className={[
          "touch-pan-y select-none overflow-hidden rounded-3xl border",
          "border-[var(--sea-ink)]/10 bg-white/80 p-6 shadow-sm sm:p-9",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        ].join(" ")}
        style={{
          transform: `translateX(${dragX * 0.15}px) rotate(${dragX * 0.015}deg)`,
          transition: isDragging ? "none" : "transform 180ms ease",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="mb-8 flex items-center justify-between">
          <span className="rounded-full bg-[var(--sea-ink)]/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink)]/65">
            Your new word
          </span>

          <Headphones
            aria-hidden="true"
            className="h-5 w-5 text-[var(--sea-ink)]/45"
          />
        </div>

        <div className="pb-8 text-center">
          <h2
            lang="om"
            className="break-words text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl"
          >
            {word.word}
          </h2>

          {word.transliteration && (
            <p className="mt-3 text-sm text-[var(--sea-ink)]/60">
              {word.transliteration}
            </p>
          )}

          <button
            type="button"
            onClick={playAudio}
            disabled={!word.audioUrl || isPlaying}
            aria-label={`Listen to ${word.word}`}
            className="mx-auto mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--sea-ink)]/15 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--sea-ink)]/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPlaying ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}

            {isPlaying ? "Playing pronunciation…" : "Listen to pronunciation"}
          </button>

          {!word.audioUrl && (
            <p className="mt-2 text-xs text-[var(--sea-ink)]/50">
              Pronunciation audio is not available for this word yet.
            </p>
          )}

          {audioError && (
            <p role="status" className="mt-2 text-xs text-red-600">
              Couldn't play the recording. Please try again.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-[var(--sea-ink)]/[0.04] p-5 sm:p-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--sea-ink)]/50">
            Meaning
          </p>

          <p className="text-xl font-semibold leading-relaxed text-[var(--sea-ink)] sm:text-2xl">
            {word.meaning}
          </p>

          {word.example && (
            <div className="mt-5 border-t border-[var(--sea-ink)]/10 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--sea-ink)]/50">
                Example
              </p>
              <p className="leading-relaxed text-[var(--sea-ink)]/80">
                {word.example}
              </p>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-[var(--sea-ink)]/45">
          Swipe left for the next word · Swipe right to go back
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--sea-ink)]/15 px-4 text-sm font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--sea-ink)]/5 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>

        <button
          type="button"
          onClick={isLastCard ? onFinish : onNext}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--sea-ink)] px-5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {isLastCard ? (
            <>
              Start practice
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

