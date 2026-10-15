import {
  BookOpen,
  CheckCircle2,
  Target,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const stats = [
  {
    label: "Words learned",
    value: "0",
    suffix: "words",
    description: "Your vocabulary starts here",
    icon: BookOpen,
    accent: "bg-[var(--foam)]",
    iconColor: "text-[var(--sea-ink)]",
    decoration: "bg-[var(--foam)]/70",
    progress: 0,
    target: "10 words to get started",
  },
  {
    label: "Lessons completed",
    value: "0",
    suffix: "lessons",
    description: "Every lesson moves you forward",
    icon: CheckCircle2,
    accent: "bg-[var(--sand)]",
    iconColor: "text-[var(--sea-ink)]",
    decoration: "bg-[var(--sand)]/70",
    progress: 0,
    target: "Your first lesson awaits",
  },
  {
    label: "Daily goal",
    value: "0",
    suffix: "/ 5 words",
    description: "A little practice goes a long way",
    icon: Target,
    accent: "bg-[var(--hero-a)]/15",
    iconColor: "text-[var(--sea-ink)]",
    decoration: "bg-[var(--hero-a)]/10",
    progress: 0,
    target: "5 words to reach your goal",
  },
];

export function LearningProgress() {
  return (
    <section className="space-y-6">
      {/* Section heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--hero-b)]" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Your learning journey
            </p>
          </div>

          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Small steps,{" "}
            <span className="text-[var(--sea-ink)]">big progress.</span>
          </h2>

          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Every new word brings you closer to speaking Afaan Oromoo with
            confidence.
          </p>
        </div>

        <div className="mb-1 hidden items-center gap-2 rounded-full border border-[var(--foam)] bg-white/60 px-3 py-2 text-xs font-medium text-muted-foreground sm:flex">
          <Sparkles className="h-3.5 w-3.5 text-[var(--hero-b)]" />
          Your journey starts here
        </div>
      </div>

      {/* Progress cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.label}
              className="group relative isolate overflow-hidden rounded-3xl border border-[var(--foam)]/80 bg-white/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--sea-ink)]/5"
            >
              {/* Decorative background shape */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute -right-10 -top-10 -z-10 h-32 w-32 rounded-full ${stat.decoration} blur-2xl transition-transform duration-500 group-hover:scale-125`}
              />

              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.accent} transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105`}
                  >
                    <Icon
                      className={`h-5 w-5 ${stat.iconColor}`}
                      strokeWidth={1.8}
                    />
                  </div>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--foam)] bg-white/70 text-muted-foreground transition-all group-hover:border-[var(--sea-ink)]/20 group-hover:text-[var(--sea-ink)]">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight text-[var(--sea-ink)]">
                      {stat.value}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {stat.suffix}
                    </span>
                  </div>

                  <p className="mt-2 min-h-5 text-xs leading-5 text-muted-foreground">
                    {stat.description}
                  </p>
                </div>

                {/* Progress indicator */}
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {stat.target}
                    </span>
                    <span className="text-xs font-semibold text-[var(--sea-ink)]">
                      {stat.progress}%
                    </span>
                  </div>

                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-[var(--foam)]"
                    role="progressbar"
                    aria-label={`${stat.label} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={stat.progress}
                  >
                    <div
                      className="h-full rounded-full bg-[var(--sea-ink)] transition-all duration-700"
                      style={{ width: `${stat.progress}%` }}
                    />
                  </div>
                </div>

                {/* Bottom accent */}
                <div className="mt-5 flex items-center gap-2 border-t border-[var(--foam)]/70 pt-4">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${stat.accent}`}
                  >
                    <Icon className={`h-3 w-3 ${stat.iconColor}`} />
                  </span>

                  <span className="text-xs font-medium text-muted-foreground">
                    {index === 0
                      ? "Build your vocabulary"
                      : index === 1
                        ? "Learn at your own pace"
                        : "Make today count"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
