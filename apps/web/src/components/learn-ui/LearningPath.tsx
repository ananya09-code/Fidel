import { LockKeyhole, Check, Star, Play, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLearningPath } from "@/hooks/use-learning-path";

type LessonStatus = "completed" | "current" | "locked";
type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  status: LessonStatus;
  wordCount: number;
};

type Unit = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  totalWords: number;
  lessons: Lesson[];
};

const LEVEL_COLORS = ["#E9A23B", "#7C83FD", "#39C987", "#E879A9"];

function LessonNode({
  lesson,
  index,
  color,
  languageCode,
}: {
  lesson: Lesson;
  index: number;
  color: string;
  languageCode: string;
}) {
  const isCompleted = lesson.status === "completed";
  const isCurrent = lesson.status === "current";
  const isLocked = lesson.status === "locked";

  const horizontalPosition = [0, 1, 2, 1, 0][index % 5];

  return (
    <div
      className="relative flex flex-col items-center"
      style={{
        transform: `translateX(${(horizontalPosition - 1) * 66}px)`,
      }}
    >
      <div className="relative">
        {isCurrent && (
          <div
            className="absolute -inset-2 animate-pulse rounded-full opacity-30"
            style={{ backgroundColor: color }}
          />
        )}
        {isLocked ? (
          <button
            type="button"
            disabled
            aria-label={`${lesson.title}, locked`}
            className="relative z-10 hidden h-[68px] w-[68px] cursor-not-allowed items-center justify-center rounded-full border-b-[6px] border-[#D8DCE3] bg-[#ECEEF2] text-[#A6ACB8] md:flex"
          >
            <LockKeyhole className="h-6 w-6" />
          </button>
        ) : (
          <Link
            to="/Learn/$lessonId"
            params={{ lessonId: lesson.id }}
            search={{ language_code: languageCode }}
            className={[
              "relative z-10 hidden h-[68px] w-[68px] items-center justify-center rounded-full border-b-[6px] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 md:flex",
              isCompleted
                ? "border-[#239B65] bg-[#39C987] text-white hover:scale-105"
                : "text-white hover:scale-105",
            ].join(" ")}
            style={
              isCurrent
                ? {
                  backgroundColor: color,
                  borderBottomColor: `${color}B0`,
                }
                : undefined
            }
            aria-label={lesson.title}
          >
            {isCompleted && <Check className="h-8 w-8 stroke-[3]" />}
            {isCurrent && <Play className="ml-1 h-7 w-7 fill-current" />}
          </Link>)}
        {isCurrent && (
          <span
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-extrabold text-white shadow-sm"
            style={{ backgroundColor: color }}
          >
            START HERE
            <span
              className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45"
              style={{ backgroundColor: color }}
            />
          </span>
        )}

        {isCompleted && (
          <Star className="absolute -right-1 -top-1 h-6 w-6 fill-[#FFD45C] text-[#E7AC20]" />
        )}
      </div>

      <div className="mt-3 max-w-[160px] text-center">
        <p
          className={[
            "text-sm font-bold",
            isLocked
              ? "text-muted-foreground"
              : "text-[var(--sea-ink)]",
          ].join(" ")}
        >
          {lesson.title}
        </p>

        <p className="mt-1 text-xs leading-4 text-muted-foreground">
          {lesson.subtitle}
        </p>

        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {lesson.wordCount} words
        </p>
      </div>
    </div>
  );
}
export function LearningPath() {
  const {
    data: learningPath,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useLearningPath("om");

  if (isPending) {
    return (
      <section className="mx-auto w-full max-w-3xl py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-border border-t-amber-500" />
        <p className="mt-4 text-sm text-muted-foreground">
          Loading your learning path...
        </p>
      </section>
    );
  }

  if (isError || !learningPath) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card p-8 text-center">
        <h2 className="text-lg font-bold">
          Couldn't load your learning path
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message ?? "No learning path data was returned."}
        </p>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {isFetching ? "Retrying..." : "Try again"}
        </button>
      </section>
    );
  }

  const units: Unit[] = learningPath.levels.map(
    (level, levelIndex) => ({
      id: level.id,
      title: level.title,
      subtitle: level.subtitle,
      color: LEVEL_COLORS[levelIndex % LEVEL_COLORS.length],
      totalWords: level.total_words,
      lessons: level.lessons.map((lesson, lessonIndex) => ({
        id: lesson.id,
        title: lesson.title,
        subtitle: lesson.subtitle,
        wordCount: lesson.word_count,
        status:
          levelIndex === 0 && lessonIndex === 0
            ? "current"
            : "locked",
      })),
    }),
  );

  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Your adventure
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-3xl">
          Your learning path
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          One little step at a time. You're doing great!
        </p>
      </div>

      {units.length === 0 ? (
        <div className="rounded-3xl border border-[var(--sea-ink)]/10 bg-white/60 p-8 text-center">
          <Star className="mx-auto h-8 w-8 text-amber-500" />
          <h3 className="mt-3 font-bold">
            Your journey starts soon
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No lessons are available for this language yet.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {units.map((unit, unitIndex) => {
            const completedCount = unit.lessons.filter(
              (lesson) => lesson.status === "completed",
            ).length;

            const progress =
              unit.lessons.length > 0
                ? Math.round(
                  (completedCount / unit.lessons.length) * 100,
                )
                : 0;

            return (
              <section
                key={unit.id}
                className="overflow-hidden rounded-3xl border border-[var(--sea-ink)]/10 bg-white/60 p-5 sm:p-8"
              >
                <div className="mb-10 flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
                    style={{ backgroundColor: unit.color }}
                  >
                    {unitIndex === 0 ? (
                      <Star className="h-7 w-7" />
                    ) : (
                      <Trophy className="h-7 w-7" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      LEVEL {String(unitIndex + 1).padStart(2, "0")}
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-[var(--sea-ink)]">
                      {unit.title}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {unit.subtitle}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {unit.totalWords} words in this level
                    </p>
                  </div>

                  <span className="shrink-0 text-xs font-bold text-muted-foreground">
                    {progress}%
                  </span>
                </div>

                <div className="mb-12 h-2 overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: unit.color,
                    }}
                  />
                </div>

                <div className="relative mx-auto flex max-w-md flex-col items-center gap-9 pb-5 pt-2">
                  {unit.lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="relative flex w-full justify-center"
                    >
                      {index < unit.lessons.length - 1 && (
                        <svg
                          aria-hidden="true"
                          className="pointer-events-none absolute left-1/2 top-[54px] z-0 h-[75px] w-[100px] -translate-x-1/2 overflow-visible"
                          viewBox="0 0 100 75"
                          fill="none"
                        >
                          <path
                            d={
                              index % 2 === 0
                                ? "M50 0 C50 28 85 35 85 75"
                                : "M85 0 C85 35 50 45 50 75"
                            }
                            stroke={
                              lesson.status === "completed"
                                ? "#39C987"
                                : "#D8DCE3"
                            }
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={
                              lesson.status === "locked" ? "5 8" : "0"
                            }
                          />
                        </svg>
                      )}

                      <div className="relative z-10">
                        <LessonNode
                          lesson={lesson}
                          index={index}
                          color={unit.color}
                          languageCode="om"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
