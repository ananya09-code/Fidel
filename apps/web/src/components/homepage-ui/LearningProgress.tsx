
import { BookOpen, CheckCircle2, Flame } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type LearningProgressProps = {
  wordsLearned?: number;
  lessonsCompleted?: number;
  streakDays?: number;
};

export function LearningProgress({
  wordsLearned = 0,
  lessonsCompleted = 0,
  streakDays = 0,
}: LearningProgressProps) {
  const stats = [
    {
      label: "Words learned",
      value: wordsLearned,
      description:
        wordsLearned === 0
          ? "Your vocabulary journey starts here"
          : "Words added to your vocabulary",
      icon: BookOpen,
    },
    {
      label: "Lessons completed",
      value: lessonsCompleted,
      description:
        lessonsCompleted === 0
          ? "Your first lesson is waiting"
          : "Lessons finished so far",
      icon: CheckCircle2,
    },
    {
      label: "Day streak",
      value: streakDays,
      description:
        streakDays === 0
          ? "Start learning to begin your streak"
          : streakDays === 1
            ? "One day at a time"
            : "Keep your learning streak going",
      icon: Flame,
    },
  ];

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-medium text-[var(--sea-ink)]/55">
          Your journey so far
        </p>

        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--sea-ink)]">
          Your learning progress
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.label}
              className="rounded-2xl border border-[var(--sea-ink)]/10 bg-white/60 shadow-sm transition-colors hover:bg-[var(--sand)]/15"
            >
              <CardContent className="flex items-start gap-4 p-5 sm:p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--sand)]">
                  <Icon
                    className="h-5 w-5 text-[var(--sea-ink)]"
                    strokeWidth={1.8}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--sea-ink)]/55">
                    {stat.label}
                  </p>

                  <p className="mt-1 text-3xl font-bold tracking-tight text-[var(--sea-ink)]">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-sm leading-5 text-[var(--sea-ink)]/55">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
