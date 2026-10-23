
import {
  ArrowRight,
  BookOpen,
} from "lucide-react";

type ContinueLessonCardProps = {
  unitNumber: number;
  lessonNumber: number;
  completedCards: number;
  totalCards: number;
  title?: string;
  description?: string;
  onContinue: () => void;
};

export function ContinueLessonCard({
  unitNumber,
  lessonNumber,
  completedCards,
  totalCards,
  title = "Your first words.",
  description = "A few familiar words are ready for another hello.",
  onContinue,
}: ContinueLessonCardProps) {
  const safeTotal = Math.max(0, totalCards);
  const safeCompleted = Math.min(
    safeTotal,
    Math.max(0, completedCards),
  );

  const progress =
    safeTotal === 0
      ? 0
      : (safeCompleted / safeTotal) * 100;

  return (
    <article className="relative overflow-hidden rounded-[28px] border border-[#E6E8DD] bg-[#EDF0E7] p-6 sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-[#DCE4D5] opacity-70"
      />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#64725E]">
            Unit {String(unitNumber).padStart(2, "0")}
          </span>

          <span className="text-xs text-[#85897F]">
            Lesson {String(lessonNumber).padStart(2, "0")}
            {" · "}
            {safeTotal} words
          </span>
        </div>

        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#252D29]">
          {title}
        </h2>

        <p className="mt-2 max-w-sm text-sm leading-6 text-[#70776C]">
          {description}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#526B53]">
            <BookOpen size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-[#4C5C4A]">
                Lesson progress
              </span>

              <span className="text-[#777D75]">
                {safeCompleted} of {safeTotal} cards
              </span>
            </div>

            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80"
              role="progressbar"
              aria-label="Lesson progress"
              aria-valuenow={safeCompleted}
              aria-valuemin={0}
              aria-valuemax={safeTotal || 1}
            >
              <div
                className="h-full rounded-full bg-[#788A6C] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#354A3B] px-5 py-4 text-sm font-medium text-white transition hover:bg-[#293C30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#788A6C] focus-visible:ring-offset-2 sm:w-auto"
        >
          Continue lesson
          <ArrowRight size={17} />
        </button>
      </div>
    </article>
  );
}
