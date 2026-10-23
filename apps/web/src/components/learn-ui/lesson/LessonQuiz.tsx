
import { useMemo, useState } from "react";
import type { FlashcardWord } from "./Flashcard";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";

type LessonQuizProps = {
  words: FlashcardWord[];
  category?: string;
  onBack?: () => void;
  onRetryMissed?: (words: FlashcardWord[]) => void;
  onFinish?: (result: {
    score: number;
    total: number;
    missedWords: FlashcardWord[];
  }) => void;
};

type QuizQuestion = {
  word: FlashcardWord;
  options: FlashcardWord[];
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function LessonQuiz({
  words,
  category = "Practice",
  onBack,
  onRetryMissed,
  onFinish,
}: LessonQuizProps) {
  const questions = useMemo<QuizQuestion[]>(() => {
    const usableWords = words.filter(
      (word) => word.word.trim() && word.meaning.trim(),
    );

    return usableWords.map((word) => {
      const distractors = shuffle(
        usableWords.filter((candidate) => candidate.id !== word.id),
      ).slice(0, 3);

      return {
        word,
        options: shuffle([word, ...distractors]),
      };
    });
  }, [words]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions[currentIndex];
  const selectedId = currentQuestion
    ? answers[currentQuestion.word.id]
    : undefined;

  const answered = selectedId !== undefined;
  const correct = selectedId === currentQuestion?.word.id;

  const missedWords = questions
    .filter((question) => answers[question.word.id] !== question.word.id)
    .map((question) => question.word);

  const score = questions.length - missedWords.length;
  const accuracy =
    questions.length > 0
      ? Math.round((score / questions.length) * 100)
      : 0;

  function selectAnswer(wordId: string) {
    if (answered || !currentQuestion) return;

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.word.id]: wordId,
    }));
  }

  function nextQuestion() {
    if (currentIndex === questions.length - 1) {
      setFinished(true);

      const nextAnswers = answers;
      const finalMissedWords = questions
        .filter(
          (question) =>
            nextAnswers[question.word.id] !== question.word.id,
        )
        .map((question) => question.word);

      const finalScore = questions.length - finalMissedWords.length;

      onFinish?.({
        score: finalScore,
        total: questions.length,
        missedWords: finalMissedWords,
      });

      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  function restartQuiz() {
    setCurrentIndex(0);
    setAnswers({});
    setFinished(false);
  }

  if (questions.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-[var(--sand)]">
          <Trophy className="size-7 text-[var(--sea-ink)]" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--sea-ink)]">
          Nothing to practise yet
        </h1>

        <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--sea-ink)]/65">
          Finish a flashcard session with words and meanings before starting
          your practice quiz.
        </p>

        <button
          type="button"
          onClick={onBack}
          className="mt-6 rounded-xl bg-[var(--sea-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Back to learning
        </button>
      </main>
    );
  }

  if (finished) {
    const perfect = score === questions.length;
    const needsPractice = accuracy < 70;

    return (
      <main className="mx-auto min-h-[80vh] max-w-2xl px-4 py-8 sm:px-6">
        <section className="overflow-hidden rounded-3xl border border-[var(--sea-ink)]/10 bg-white shadow-sm">
          <div className="flex flex-col items-center px-6 pb-8 pt-10 text-center sm:px-10">
            <div className="mb-5 flex size-20 items-center justify-center rounded-3xl bg-[var(--sand)]">
              <Trophy className="size-9 text-[var(--sea-ink)]" />
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sea-ink)]/55">
              Practice complete
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
              {perfect
                ? "Perfect work!"
                : needsPractice
                  ? "Keep building!"
                  : "Nicely done!"}
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--sea-ink)]/65">
              {perfect
                ? "You remembered every word. You're making real progress."
                : needsPractice
                  ? "A little more practice will help these words stick."
                  : "You're getting there. Keep practising to remember even more."}
            </p>

            <div className="mt-8 grid w-full grid-cols-3 gap-3">
              <div className="rounded-2xl bg-[var(--bg-base)] p-4">
                <p className="text-2xl font-bold text-[var(--sea-ink)]">
                  {score}/{questions.length}
                </p>
                <p className="mt-1 text-xs text-[var(--sea-ink)]/60">
                  Correct
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--bg-base)] p-4">
                <p className="text-2xl font-bold text-[var(--sea-ink)]">
                  {accuracy}%
                </p>
                <p className="mt-1 text-xs text-[var(--sea-ink)]/60">
                  Accuracy
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--bg-base)] p-4">
                <p className="text-2xl font-bold text-[var(--sea-ink)]">
                  {missedWords.length}
                </p>
                <p className="mt-1 text-xs text-[var(--sea-ink)]/60">
                  To review
                </p>
              </div>
            </div>
          </div>

          {missedWords.length > 0 && (
            <div className="border-t border-[var(--sea-ink)]/10 px-6 py-6 sm:px-10">
              <h2 className="font-bold text-[var(--sea-ink)]">
                Words to revisit
              </h2>

              <p className="mt-1 text-sm text-[var(--sea-ink)]/60">
                These are the words you missed this time.
              </p>

              <div className="mt-4 space-y-2">
                {missedWords.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-[var(--sea-ink)]/10 px-4 py-3"
                  >
                    <span className="font-semibold text-[var(--sea-ink)]">
                      {word.word}
                    </span>

                    <span className="text-right text-sm text-[var(--sea-ink)]/65">
                      {word.meaning}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-[var(--sea-ink)]/10 p-6 sm:flex-row sm:px-10">
            {missedWords.length > 0 && (
              <button
                type="button"
                onClick={() => onRetryMissed?.(missedWords)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--sea-ink)] px-5 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <RotateCcw className="size-4" />
                Practise missed words
              </button>
            )}

            <button
              type="button"
              onClick={restartQuiz}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--sea-ink)]/15 px-5 py-3.5 text-sm font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--bg-base)]"
            >
              Try again
            </button>

            <button
              type="button"
              onClick={onBack}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--sea-ink)]/15 px-5 py-3.5 text-sm font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--bg-base)]"
            >
              Learning path
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!currentQuestion) return null;

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <main className="mx-auto min-h-[80vh] max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Exit practice"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--sea-ink)]/10 text-[var(--sea-ink)] transition hover:bg-[var(--bg-base)]"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-[var(--sea-ink)]">
                {category}
              </span>

              <span className="text-sm tabular-nums text-[var(--sea-ink)]/60">
                {currentIndex + 1} of {questions.length}
              </span>
            </div>

            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--sea-ink)]/10"
              role="progressbar"
              aria-label="Quiz progress"
              aria-valuemin={0}
              aria-valuemax={questions.length}
              aria-valuenow={currentIndex + 1}
            >
              <div
                className="h-full rounded-full bg-[var(--sea-ink)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <section>
        <p className="text-center text-sm font-semibold uppercase tracking-[0.16em] text-[var(--sea-ink)]/50">
          Choose the correct word
        </p>

        <h1 className="mt-4 text-center text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          What is this in Afaan Oromoo?
        </h1>

        <div className="mt-8 rounded-3xl border border-[var(--sea-ink)]/10 bg-white px-5 py-8 text-center shadow-sm sm:px-8 sm:py-10">
          <p className="text-sm text-[var(--sea-ink)]/55">
            English meaning
          </p>

          <p className="mt-3 text-2xl font-bold text-[var(--sea-ink)] sm:text-3xl">
            {currentQuestion.word.meaning}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedId === option.id;
            const isCorrect = option.id === currentQuestion.word.id;

            let optionStyle =
              "border-[var(--sea-ink)]/15 bg-white hover:border-[var(--sea-ink)]/40 hover:bg-[var(--bg-base)]";

            if (answered && isCorrect) {
              optionStyle =
                "border-emerald-500 bg-emerald-50 text-emerald-950";
            } else if (answered && isSelected && !isCorrect) {
              optionStyle = "border-rose-400 bg-rose-50 text-rose-950";
            }

            return (
              <button
                key={option.id}
                type="button"
                disabled={answered}
                onClick={() => selectAnswer(option.id)}
                className={`flex min-h-[76px] items-center gap-4 rounded-2xl border-2 p-4 text-left transition duration-200 disabled:cursor-default ${optionStyle}`}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-current/15 text-sm font-semibold opacity-70">
                  {String.fromCharCode(65 + index)}
                </span>

                <span className="flex-1 text-base font-semibold">
                  {option.word}
                </span>

                {answered && isCorrect && (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                )}

                {answered && isSelected && !isCorrect && (
                  <XCircle className="size-5 shrink-0 text-rose-600" />
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            aria-live="polite"
            className={`mt-5 rounded-2xl border p-4 ${correct
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
              }`}
          >
            <div className="flex items-start gap-3">
              {correct ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="mt-0.5 size-5 shrink-0 text-rose-600" />
              )}

              <div>
                <p
                  className={`font-bold ${correct ? "text-emerald-900" : "text-rose-900"
                    }`}
                >
                  {correct ? "That's right!" : "Not quite!"}
                </p>

                <p className="mt-1 text-sm leading-6 text-[var(--sea-ink)]/75">
                  {currentQuestion.word.meaning} means{" "}
                  <strong>{currentQuestion.word.word}</strong> in Afaan
                  Oromoo.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={!answered}
            onClick={nextQuestion}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--sea-ink)] px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {currentIndex === questions.length - 1
              ? "See my results"
              : "Continue"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    </main>
  );
}
