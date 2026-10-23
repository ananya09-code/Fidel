
import { ArrowUpRight, BookOpen, CheckCircle2, Sparkles } from "lucide-react";

type LearnProgressProps = {
  wordsLearned?: number;
  lessonsCompleted?: number;
};

export function LearnProgress({
  wordsLearned = 0,
  lessonsCompleted = 0,
}: LearnProgressProps) {
  const stats = [
    {
      label: "Words learned",
      value: wordsLearned,
      description:
        wordsLearned === 0
          ? "Your first word is waiting"
          : "Words added to your journey",
      icon: BookOpen,
    },
    {
      label: "Lessons completed",
      value: lessonsCompleted,
      description:
        lessonsCompleted === 0
          ? "Your first lesson awaits"
          : "Small steps, real progress",
      icon: CheckCircle2,
    },
  ];

  const hasProgress = wordsLearned > 0 || lessonsCompleted > 0;

  return (
    <section className="space-y-5">
      {/* Section heading */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-[var(--hero-a)]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink)]/55">
              Your journey
            </p>
          </div>

          <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-[var(--sea-ink)] sm:text-2xl">
            Your progress
          </h2>

          <p className="mt-1 text-sm leading-6 text-[var(--sea-ink)]/60">
            {hasProgress
              ? "Look how far you've come."
              : "Every new word is a beginning."}
          </p>
        </div>

        <div
          aria-hidden="true"
          className="mb-1 hidden h-10 w-10 items-center justify-center rounded-full border border-[var(--sea-ink)]/10 text-[var(--sea-ink)]/55 sm:flex"
        >
          <Sparkles className="h-4 w-4" />
        </div>
      </div>

      {/* Progress statistics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-[var(--sea-ink)]/10 bg-white/50 p-4 transition-colors duration-200 hover:bg-white/80 sm:rounded-3xl sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sand)] text-[var(--sea-ink)] sm:h-11 sm:w-11">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>

                <ArrowUpRight
                  aria-hidden="true"
                  className="h-4 w-4 text-[var(--sea-ink)]/25 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </div>

              <p className="mt-5 text-3xl font-semibold tracking-[-0.06em] text-[var(--sea-ink)] sm:mt-6 sm:text-4xl">
                {stat.value.toLocaleString()}
              </p>

              <h3 className="mt-1 text-xs font-semibold text-[var(--sea-ink)] sm:text-sm">
                {stat.label}
              </h3>

              <p className="mt-2 text-[11px] leading-5 text-[var(--sea-ink)]/55 sm:text-xs">
                {stat.description}
              </p>

              {/* Subtle decorative accent */}
              <div
                aria-hidden="true"
                className={`absolute bottom-0 left-0 h-0.5 w-full ${index === 0
                    ? "bg-[var(--hero-a)]"
                    : "bg-[var(--hero-b)]"
                  } opacity-70`}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
