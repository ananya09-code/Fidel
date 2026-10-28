import { LockKeyhole, Check, Star, Play, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
type LessonStatus = "completed" | "current" | "locked";

type Lesson = {
  id: number;
  title: string;
  subtitle: string;
  status: LessonStatus;
  wordCount: number;
};

type Unit = {
  id: number;
  title: string;
  subtitle: string;
  color: string;
  lessons: Lesson[];
};

// Temporary demo content.
// Replace these categories and counts with database data later.
const units: Unit[] = [
  {
    id: 1,
    title: "Beginner",
    subtitle: "Build your foundation in Afaan Oromoo",
    color: "#E9A23B",
    lessons: [
      {
        id: 1,
        title: "Greetings",
        subtitle: "Say hello in Afaan Oromoo",
        status: "current",
        wordCount: 12,
      },
      {
        id: 2,
        title: "Basic Responses",
        subtitle: "Learn common replies",
        status: "locked",
        wordCount: 10,
      },
      {
        id: 3,
        title: "Introductions",
        subtitle: "Introduce yourself",
        status: "locked",
        wordCount: 10,
      },
      {
        id: 4,
        title: "People & Family",
        subtitle: "Talk about people close to you",
        status: "locked",
        wordCount: 15,
      },
      {
        id: 5,
        title: "Numbers",
        subtitle: "Count in Afaan Oromoo",
        status: "locked",
        wordCount: 12,
      },
      {
        id: 6,
        title: "Food & Drinks",
        subtitle: "Learn everyday food vocabulary",
        status: "locked",
        wordCount: 12,
      },
      {
        id: 7,
        title: "Daily Activities",
        subtitle: "Talk about your day",
        status: "locked",
        wordCount: 15,
      },
      {
        id: 8,
        title: "Everyday Objects",
        subtitle: "Name things around you",
        status: "locked",
        wordCount: 12,
      },
      {
        id: 9,
        title: "Time & Days",
        subtitle: "Talk about time",
        status: "locked",
        wordCount: 10,
      },
      {
        id: 10,
        title: "Places & Directions",
        subtitle: "Talk about places",
        status: "locked",
        wordCount: 12,
      },
      {
        id: 11,
        title: "Common Verbs",
        subtitle: "Learn everyday actions",
        status: "locked",
        wordCount: 15,
      },
      {
        id: 12,
        title: "Simple Sentences",
        subtitle: "Put words together",
        status: "locked",
        wordCount: 10,
      },
    ],
  },
];

function LessonNode({
  lesson,
  index,
  color,
}: {
  lesson: Lesson;
  index: number;
  color: string;
}) {
  const isCompleted = lesson.status === "completed";
  const isCurrent = lesson.status === "current";
  const isLocked = lesson.status === "locked";

  // Zigzag the lesson nodes along the path.
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
        <Link
          to="/test"
          className="relative z-10 hidden shrink-0 items-center gap-2.5 md:flex"
          aria-label="Fidel home"
        >

          <button
            type="button"
            disabled={isLocked}
            aria-label={`${lesson.title}${isLocked ? ", locked" : ""}`}
            className={[
              "relative flex h-[68px] w-[68px] items-center justify-center rounded-full",
              "border-b-[6px] transition-transform duration-200",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2",
              isCompleted
                ? "border-[#239B65] bg-[#39C987] text-white hover:scale-105"
                : "",
              isCurrent ? "border-transparent text-white hover:scale-105" : "",
              isLocked
                ? "cursor-not-allowed border-[#D8DCE3] bg-[#ECEEF2] text-[#A6ACB8]"
                : "",
            ].join(" ")}
            style={
              isCurrent
                ? {
                  backgroundColor: color,
                  borderBottomColor: `${color}B0`,
                }
                : undefined
            }
          >
            {isCompleted && <Check className="h-8 w-8 stroke-[3]" />}
            {isCurrent && <Play className="ml-1 h-7 w-7 fill-current" />}
            {isLocked && <LockKeyhole className="h-6 w-6" />}
          </button>
        </Link>
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
            isLocked ? "text-muted-foreground" : "text-[var(--sea-ink)]",
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

      <div className="space-y-12">
        {units.map((unit) => {
          const completedCount = unit.lessons.filter(
            (lesson) => lesson.status === "completed",
          ).length;

          const progress = Math.round(
            (completedCount / unit.lessons.length) * 100,
          );

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
                  {unit.id === 1 ? (
                    <Star className="h-7 w-7" />
                  ) : (
                    <Trophy className="h-7 w-7" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    LEVEL {String(unit.id).padStart(2, "0")}
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-[var(--sea-ink)]">
                    {unit.title}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {unit.subtitle}
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
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
