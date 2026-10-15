import { BookOpen, CheckCircle2 } from "lucide-react";

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
      icon: BookOpen,
    },
    {
      label: "Lessons completed",
      value: lessonsCompleted,
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-[var(--sea-ink)]">
          Your progress
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every word is a step forward.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-[var(--sea-ink)]/10 bg-white/60 p-5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--sand)] text-[var(--sea-ink)]">
                <Icon className="h-5 w-5" />
              </span>

              <div>
                <p className="text-2xl font-semibold tracking-tight text-[var(--sea-ink)]">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
