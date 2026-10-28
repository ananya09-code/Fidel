
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Headphones,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export type ReviewWord = {
  id: string;
  word: string;
  meaning: string;
  category: string;
  status: "needs_review" | "learning" | "mastered";
  audioUrl?: string | null;
};

type ReviewOverviewProps = {
  words?: ReviewWord[];
  onStartReview?: (words: ReviewWord[]) => void;
  onReviewCategory?: (category: string, words: ReviewWord[]) => void;
  onViewAllWords?: () => void;
};

const demoWords: ReviewWord[] = [
  {
    id: "1",
    word: "Galatoomi",
    meaning: "Thank you",
    category: "Greetings",
    status: "needs_review",
  },
  {
    id: "2",
    word: "Akkam",
    meaning: "Hello",
    category: "Greetings",
    status: "learning",
  },
  {
    id: "3",
    word: "Nagaa",
    meaning: "Peace",
    category: "Greetings",
    status: "mastered",
  },
  {
    id: "4",
    word: "Maaloo",
    meaning: "Please",
    category: "Everyday phrases",
    status: "needs_review",
  },
  {
    id: "5",
    word: "Eeyyee",
    meaning: "Yes",
    category: "Everyday phrases",
    status: "learning",
  },
  {
    id: "6",
    word: "Lakki",
    meaning: "No",
    category: "Everyday phrases",
    status: "needs_review",
  },
  {
    id: "7",
    word: "Akkam jirta?",
    meaning: "How are you?",
    category: "Greetings",
    status: "learning",
  },
  {
    id: "8",
    word: "Nagaatti",
    meaning: "Goodbye",
    category: "Greetings",
    status: "mastered",
  },
  {
    id: "9",
    word: "Maqaan kee eenyu?",
    meaning: "What is your name?",
    category: "Everyday phrases",
    status: "needs_review",
  },
  {
    id: "10",
    word: "Nagaan buli",
    meaning: "Good night",
    category: "Greetings",
    status: "learning",
  },
];

const statusLabels: Record<ReviewWord["status"], string> = {
  needs_review: "Review",
  learning: "Learning",
  mastered: "Mastered",
};

function playAudio(audioUrl?: string | null) {
  if (!audioUrl) return;

  const audio = new Audio(audioUrl);
  void audio.play().catch(() => {
    // Playback can fail if the browser blocks audio or the URL is unavailable.
  });
}

export function ReviewOverview({
  words = demoWords,
  onStartReview,
  onReviewCategory,
  onViewAllWords,
}: ReviewOverviewProps) {
  const reviewWords = words.filter(
    (word) => word.status === "needs_review",
  );
  const learningWords = words.filter(
    (word) => word.status === "learning",
  );
  const masteredWords = words.filter(
    (word) => word.status === "mastered",
  );

  const categories = Array.from(
    words.reduce((map, word) => {
      const existing = map.get(word.category) ?? [];
      map.set(word.category, [...existing, word]);
      return map;
    }, new Map<string, ReviewWord[]>()),
  );

  const visibleWords = [...reviewWords, ...learningWords].slice(0, 5);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-[var(--sea-ink)]/55">
          YOUR LEARNING JOURNEY
        </p>

        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
              Review
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--sea-ink)]/65 sm:text-base">
              A little practice goes a long way. Strengthen the words
              you&apos;ve learned and build your confidence.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border border-[var(--sea-ink)]/10 bg-white px-3 py-2 text-sm text-[var(--sea-ink)]/70">
            <BookOpen className="size-4" />
            Afaan Oromoo
          </div>
        </div>
      </header>

      {/* Summary cards */}
      <section
        aria-label="Vocabulary overview"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <StatCard
          icon={<RotateCcw className="size-5" />}
          label="To review"
          value={reviewWords.length}
          description="Words to practise again"
        />

        <StatCard
          icon={<Clock3 className="size-5" />}
          label="Still learning"
          value={learningWords.length}
          description="Words you're getting familiar with"
        />

        <StatCard
          icon={<CheckCircle2 className="size-5" />}
          label="Mastered"
          value={masteredWords.length}
          description="Words marked as mastered"
        />
      </section>

      {/* Main review action */}
      <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--sea-ink)]/10 bg-white shadow-sm">
        <div className="grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:p-10">
          <div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--sand)] text-[var(--sea-ink)]">
              <Sparkles className="size-6" />
            </div>

            <h2 className="mt-5 text-2xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-3xl">
              Ready to practise?
            </h2>

            <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--sea-ink)]/65 sm:text-base">
              Revisit familiar words, work on the tricky ones, and
              make your Afaan Oromoo stick.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[var(--sea-ink)]/70">
              <span className="rounded-full bg-[var(--bg-base)] px-3 py-1.5">
                {reviewWords.length} words to revisit
              </span>

              <span className="rounded-full bg-[var(--bg-base)] px-3 py-1.5">
                Short practice session
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={reviewWords.length === 0}
            onClick={() => onStartReview?.(reviewWords)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--sea-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start review
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>

      {/* Categories */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--sea-ink)]">
              Review by category
            </h2>

            <p className="mt-1 text-sm text-[var(--sea-ink)]/60">
              Focus on one topic at a time.
            </p>
          </div>
        </div>

        {categories.length === 0 ? (
          <EmptyState message="Your vocabulary categories will appear here once you've learned some words." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {categories.map(([category, categoryWords], index) => {
              const categoryReviewCount = categoryWords.filter(
                (word) => word.status === "needs_review",
              ).length;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onReviewCategory?.(category, categoryWords)}
                  className="group flex items-center gap-4 rounded-2xl border border-[var(--sea-ink)]/10 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--sea-ink)]/25 hover:shadow-sm sm:p-5"
                >
                  <div
                    className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${index % 2 === 0
                        ? "bg-[var(--sand)]"
                        : "bg-[var(--bg-base)]"
                      } text-[var(--sea-ink)]`}
                  >
                    <BookOpen className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[var(--sea-ink)]">
                      {category}
                    </h3>

                    <p className="mt-1 text-sm text-[var(--sea-ink)]/60">
                      {categoryWords.length}{" "}
                      {categoryWords.length === 1 ? "word" : "words"}
                      {categoryReviewCount > 0 &&
                        ` · ${categoryReviewCount} to review`}
                    </p>
                  </div>

                  <ArrowRight className="size-5 shrink-0 text-[var(--sea-ink)]/40 transition group-hover:translate-x-1 group-hover:text-[var(--sea-ink)]" />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Word list */}
      <section className="mt-10">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--sea-ink)]">
              Words to revisit
            </h2>

            <p className="mt-1 text-sm text-[var(--sea-ink)]/60">
              Keep the words you&apos;re learning fresh in your memory.
            </p>
          </div>

          {words.length > 5 && (
            <button
              type="button"
              onClick={onViewAllWords}
              className="flex w-fit items-center gap-1 text-sm font-semibold text-[var(--sea-ink)] transition hover:opacity-65"
            >
              View all words
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>

        {visibleWords.length === 0 ? (
          <EmptyState message="Nothing to review right now. Keep learning new words and they'll show up here." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--sea-ink)]/10 bg-white">
            {visibleWords.map((word, index) => (
              <div
                key={word.id}
                className={`flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap sm:gap-5 sm:px-5 ${index > 0 ? "border-t border-[var(--sea-ink)]/10" : ""
                  }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--sea-ink)]">
                    {word.word}
                  </p>

                  <p className="mt-1 text-sm text-[var(--sea-ink)]/60">
                    {word.meaning}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${word.status === "needs_review"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-[var(--bg-base)] text-[var(--sea-ink)]/70"
                    }`}
                >
                  {statusLabels[word.status]}
                </span>

                <button
                  type="button"
                  onClick={() => playAudio(word.audioUrl)}
                  disabled={!word.audioUrl}
                  aria-label={`Play pronunciation for ${word.word}`}
                  title={
                    word.audioUrl
                      ? `Play ${word.word}`
                      : "Audio is not available yet"
                  }
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--sea-ink)]/10 text-[var(--sea-ink)] transition hover:bg-[var(--bg-base)] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Headphones className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="mt-6 text-center text-xs leading-5 text-[var(--sea-ink)]/45">
        Demo vocabulary and review statuses for now. Your personal review
        progress will be connected to your learning activity later.
      </p>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--sea-ink)]/10 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[var(--sea-ink)]/65">
          {label}
        </span>

        <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--bg-base)] text-[var(--sea-ink)]">
          {icon}
        </span>
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--sea-ink)]">
        {value}
      </p>

      <p className="mt-1 text-sm text-[var(--sea-ink)]/55">
        {description}
      </p>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--sea-ink)]/20 bg-white px-5 py-8 text-center">
      <BookOpen className="mx-auto size-6 text-[var(--sea-ink)]/45" />

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--sea-ink)]/65">
        {message}
      </p>
    </div>
  );
}
