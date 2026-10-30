import { LockKeyhole, Check, Star, Play, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLearningPath } from "@/hooks/use-learning-path";
import { useLearningProgress } from "@/hooks/use-learning-progress";
import { usePreferences } from "@/hooks/use-preferences";
import { PageState } from "@/components/common-ui/PageState";

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
  const horizontalOffset = [
    "md:-translate-x-[66px]",
    "md:translate-x-0",
    "md:translate-x-[66px]",
    "md:translate-x-0",
    "md:-translate-x-[66px]",
  ][horizontalPosition];

  return (
    <div className={`relative flex flex-col items-center ${horizontalOffset}`}>
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
            className="relative z-10 flex h-[68px] w-[68px] cursor-not-allowed items-center justify-center rounded-full border-b-[6px] border-[var(--sea-ink)]/15 bg-white/55 text-[var(--sea-ink)]/35"
          >
            <LockKeyhole className="h-6 w-6" />
          </button>
        ) : (
          <Link
            to="/Learn/$lessonId"
            params={{ lessonId: lesson.id }}
            search={{ language_code: languageCode }}
            className={[
              "relative z-10 flex h-[68px] w-[68px] items-center justify-center rounded-full border-b-[6px] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2",
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
              ? "text-[var(--sea-ink)]/40"
              : "text-[var(--sea-ink)]",
          ].join(" ")}
        >
          {lesson.title}
        </p>

        <p className="mt-1 text-xs leading-4 text-[var(--sea-ink)]/55">
          {lesson.subtitle}
        </p>

        <p className="mt-1 text-xs font-medium text-[var(--sea-ink)]/50">
          {lesson.wordCount} words
        </p>
      </div>
    </div>
  );
}
export function LearningPath() {
  const preferences = usePreferences();
  const progressQuery = useLearningProgress();
  const languageCode = preferences.data?.learning_language ?? "om";
  const {
    data: learningPath,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useLearningPath(languageCode);

  if (isPending || preferences.isPending || progressQuery.isPending) {
    return <PageState kind="loading" title="Loading your learning path" />;
  }

  if (isError || preferences.isError || progressQuery.isError || !learningPath) {
    return <PageState kind="error" title="Couldn't load your learning path" description={error?.message ?? preferences.error?.message ?? progressQuery.error?.message ?? "No learning path data was returned."} actionLabel={isFetching ? "Retrying..." : "Try again"} onAction={() => void refetch()} />;
  }

  const completedLessons = new Set(progressQuery.data?.completed_lesson_keys ?? []);
  const allLessonIds = learningPath.levels.flatMap((level) =>
    level.lessons.map((lesson) => lesson.id),
  );
  const activeLesson = progressQuery.data?.in_progress[0]?.lesson_key;
  const currentLesson =
    activeLesson ?? allLessonIds.find((lessonId) => !completedLessons.has(lessonId));

  const units: Unit[] = learningPath.levels.map(
    (level, levelIndex) => ({
      id: level.id,
      title: level.title,
      subtitle: level.subtitle,
      color: LEVEL_COLORS[levelIndex % LEVEL_COLORS.length],
      totalWords: level.total_words,
      lessons: level.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        subtitle: lesson.subtitle,
        wordCount: lesson.word_count,
        status: completedLessons.has(lesson.id)
          ? "completed"
          : lesson.id === currentLesson
            ? "current"
            : "locked",
      })),
    }),
  );

  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--sea-ink)]/50">
          Your adventure
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-3xl">
          Your learning path
        </h2>

        <p className="mt-2 text-sm text-[var(--sea-ink)]/55">
          One little step at a time. You're doing great!
        </p>
      </div>

      {units.length === 0 ? (
        <PageState kind="empty" title="Your journey starts soon" description="No lessons are available for this language yet." compact />
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
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--sea-ink)]/45">
                      LEVEL {String(unitIndex + 1).padStart(2, "0")}
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-[var(--sea-ink)]">
                      {unit.title}
                    </h3>

                    <p className="mt-1 text-sm text-[var(--sea-ink)]/55">
                      {unit.subtitle}
                    </p>

                    <p className="mt-1 text-xs text-[var(--sea-ink)]/50">
                      {unit.totalWords} words in this level
                    </p>
                  </div>

                  <span className="shrink-0 text-xs font-bold text-[var(--sea-ink)]/50">
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
                          languageCode={languageCode}
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
