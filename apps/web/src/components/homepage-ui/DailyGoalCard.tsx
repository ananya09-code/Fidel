import {
  BookOpen,
  Flame,
  Sparkles,
} from "lucide-react";

type DailyGoalCardProps = {
  goalWords: number;
  completedWords: number;
  streak: number;
  wordsLearned: number;
};

export function DailyGoalCard({
  goalWords,
  completedWords,
  streak,
  wordsLearned,
}: DailyGoalCardProps) {
  const safeGoal = Math.max(1, goalWords);
  const safeCompleted = Math.max(0, completedWords);

  const progress =
    safeGoal === 0
      ? 100
      : Math.min(100, (safeCompleted / safeGoal) * 100);

  const wordsRemaining = Math.max(
    0,
    safeGoal - safeCompleted,
  );

  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sea-ink)]/60">
            Your daily goal
          </p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight text-[var(--sea-ink)]">
              {safeCompleted}
            </span>

            <span className="text-sm text-[var(--sea-ink)]/60">
              / {safeGoal} words
            </span>
          </div>

          <p className="mt-2 text-sm text-[var(--sea-ink)]/65">
            {wordsRemaining > 0
              ? `${wordsRemaining} ${wordsRemaining === 1 ? "word" : "words"} to go`
              : "Daily goal completed. Well done!"}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-700 dark:text-orange-300">
          <Sparkles size={22} strokeWidth={1.7} />
        </div>
      </div>

      <div
        className="mt-6 h-2 overflow-hidden rounded-full bg-[var(--sand)]"
        role="progressbar"
        aria-label="Daily word learning goal"
        aria-valuenow={safeGoal === 0 ? 0 : Math.min(safeCompleted, safeGoal)}
        aria-valuemin={0}
        aria-valuemax={safeGoal || 1}
      >
        <div
          className="h-full rounded-full bg-[#C77B49] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--line)] pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-700 dark:text-orange-300">
            <Flame size={19} strokeWidth={1.8} />
          </div>

          <div>
            <p className="text-lg font-semibold text-[var(--sea-ink)]">
              {streak}
            </p>
            <p className="text-xs text-[var(--sea-ink)]/60">
              Day streak
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--palm)]/10 text-[var(--palm)]">
            <BookOpen size={19} strokeWidth={1.8} />
          </div>

          <div>
            <p className="text-lg font-semibold text-[var(--sea-ink)]">
              {wordsLearned}
            </p>
            <p className="text-xs text-[var(--sea-ink)]/60">
              Words learned
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

