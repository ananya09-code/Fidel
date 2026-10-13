import { useRef, useState } from "react";
import { Volume2, Check, X, ArrowRight } from "lucide-react";

interface WordQuestionCardProps {
  word: string;
  pronunciation: string;
  explanation: string;
  options: string[];
  correctAnswer: string;
  audioSrc: string;
  onNext?: () => void;
}

export default function WordQuestionCard({
  word,
  pronunciation,
  explanation,
  options,
  correctAnswer,
  audioSrc,
  onNext,
}: WordQuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isCorrect = selectedAnswer === correctAnswer;

  function playAudio() {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioSrc);

      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
      });

      audioRef.current.addEventListener("error", () => {
        setIsPlaying(false);
      });
    }

    if (audioRef.current.src !== new URL(audioSrc, window.location.href).href) {
      audioRef.current.src = audioSrc;
    }

    audioRef.current.currentTime = 0;
    setIsPlaying(true);

    audioRef.current.play().catch(() => {
      setIsPlaying(false);
      console.error("Unable to play audio:", audioSrc);
    });
  }

  function continueLesson() {
    audioRef.current?.pause();
    setIsPlaying(false);
    setSelectedAnswer(null);
    onNext?.();
  }

  return (
    <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-[var(--foam)] p-6 shadow-sm sm:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--sea-ink)] opacity-65">
          Word challenge
        </span>

        <span className="rounded-full bg-[var(--hero-a)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)]">
          Vocabulary
        </span>
      </div>

      {/* Word */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[var(--sand)] text-5xl">
          💬
        </div>

        <h2 className="text-5xl font-bold tracking-tight text-[var(--sea-ink)]">
          {word}
        </h2>

        <p className="mt-3 text-base text-[var(--sea-ink)] opacity-65">
          {pronunciation}
        </p>

        {/* Audio Player */}
        <button
          type="button"
          onClick={playAudio}
          aria-label="Play word pronunciation"
          className="mx-auto mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--hero-b)] bg-[var(--foam)] px-5 py-3 font-semibold text-[var(--sea-ink)] transition hover:brightness-95 active:scale-[0.98]"
        >
          <Volume2
            className={`h-5 w-5 text-[var(--hero-b)] ${
              isPlaying ? "animate-pulse" : ""
            }`}
          />
          {isPlaying ? "Playing pronunciation..." : "Listen to pronunciation"}
        </button>
      </div>

      {/* Explanation */}
      <div className="mb-8 rounded-2xl border border-[var(--foam)] bg-[var(--sand)] p-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--sea-ink)] opacity-65">
          Word meaning
        </p>

        <p className="text-sm leading-7 text-[var(--sea-ink)]">{explanation}</p>
      </div>

      {/* Multiple Choice */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-[var(--sea-ink)]">
          Choose the correct meaning
        </h3>

        <div className="space-y-3">
          {options.map((option, index) => {
            const selected = selectedAnswer === option;
            const correct = option === correctAnswer;

            let optionStyle =
              "border-[var(--foam)] bg-[var(--bg-base)] hover:border-[var(--hero-b)] hover:bg-[var(--sand)]";

            if (selectedAnswer && correct) {
              optionStyle = "border-teal-600 bg-teal-50 text-teal-900";
            } else if (selected && !isCorrect) {
              optionStyle = "border-orange-400 bg-orange-50 text-orange-900";
            }

            return (
              <button
                key={option}
                type="button"
                disabled={selectedAnswer !== null}
                onClick={() => setSelectedAnswer(option)}
                className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${optionStyle}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--sand)] text-sm font-bold text-[var(--sea-ink)]">
                  {String.fromCharCode(65 + index)}
                </span>

                <span className="flex-1 font-medium">{option}</span>

                {selectedAnswer && correct && (
                  <Check className="h-5 w-5 shrink-0 text-teal-700" />
                )}

                {selected && !isCorrect && (
                  <X className="h-5 w-5 shrink-0 text-orange-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Answer Feedback */}
      {selectedAnswer && (
        <div
          role="status"
          className={`mt-6 rounded-2xl border p-4 ${
            isCorrect
              ? "border-teal-200 bg-teal-50 text-teal-900"
              : "border-orange-200 bg-orange-50 text-orange-900"
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {isCorrect ? (
              <Check className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}

            {isCorrect ? "Excellent! You got it." : "Not quite. Keep going!"}
          </div>

          {!isCorrect && (
            <p className="mt-2 text-sm">
              Correct answer: <strong>{correctAnswer}</strong>
            </p>
          )}
        </div>
      )}

      {/* Continue */}
      <button
        type="button"
        disabled={!selectedAnswer}
        onClick={continueLesson}
        className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--sea-ink)] px-5 py-4 font-bold text-[var(--foam)] transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue
        <ArrowRight className="h-5 w-5" />
      </button>
    </section>
  );
}
