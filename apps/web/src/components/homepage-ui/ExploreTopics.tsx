import {
  ArrowDownRight,
  ArrowRight,
  Check,
  Coffee,
  LockKeyhole,
  MessageCircle,
  Sparkles,
  Utensils,
  Users,
} from "lucide-react";

import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const topics = [
  {
    title: "Greetings",
    description: "Start conversations, say hello, and introduce yourself.",
    icon: MessageCircle,
    color: "bg-[var(--foam)]",
    number: "01",
    available: true,
    lessons: "Start here",
  },
  {
    title: "Daily life",
    description: "Talk about your routine and everyday activities.",
    icon: Coffee,
    color: "bg-[var(--sand)]",
    number: "02",
    available: false,
    lessons: "Coming soon",
  },
  {
    title: "Food & drinks",
    description: "Discover food vocabulary and ordering essentials.",
    icon: Utensils,
    color: "bg-orange-100",
    number: "03",
    available: false,
    lessons: "Coming soon",
  },
  {
    title: "People & family",
    description: "Talk about friends, family, and the people around you.",
    icon: Users,
    color: "bg-sky-100",
    number: "04",
    available: false,
    lessons: "Coming soon",
  },
];

export function ExploreTopics() {
  return (
    <section className="space-y-6">
      {/* Section heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--hero-b)]" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Find your words
            </p>
          </div>

          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            What would you like to{" "}
            <span className="text-[var(--sea-ink)]">learn?</span>
          </h2>

          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Explore useful topics and build the confidence to use Afaan Oromoo
            in everyday life.
          </p>
        </div>

        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-[var(--foam)] bg-white/70 px-3 py-1.5"
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--hero-b)]" />
          {topics.filter((topic) => topic.available).length} of {topics.length}{" "}
          topics
        </Badge>
      </div>

      {/* Topic cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topics.map((topic, index) => {
          const Icon = topic.icon;

          const cardContent = (
            <CardContent className="relative flex h-full flex-col overflow-hidden p-5 sm:p-6">
              {/* Decorative background */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full ${topic.color} opacity-60 blur-2xl transition-transform duration-500 group-hover:scale-125`}
              />

              {/* Topic number and status */}
              <div className="relative flex items-center justify-between">
                <span className="text-xs font-bold tracking-[0.15em] text-muted-foreground/70">
                  TOPIC {topic.number}
                </span>

                {topic.available ? (
                  <Badge className="gap-1 rounded-full border-0 bg-[var(--sea-ink)] text-[var(--foam)] hover:bg-[var(--sea-ink)]">
                    <Check className="h-3 w-3" />
                    Ready
                  </Badge>
                ) : (
                  <LockKeyhole
                    className="h-4 w-4 text-muted-foreground/50"
                    aria-label="Coming soon"
                  />
                )}
              </div>

              {/* Icon illustration */}
              <div className="relative mt-7">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-[20px] ${topic.color} transition-transform duration-300 group-hover:rotate-[-5deg] group-hover:scale-105`}
                >
                  <Icon
                    className="h-6 w-6 text-[var(--sea-ink)]"
                    strokeWidth={1.7}
                  />
                </div>

                {index === 0 && (
                  <span className="absolute -right-1 top-0 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-[var(--hero-b)]">
                    <Sparkles className="h-3 w-3 text-[var(--sea-ink)]" />
                  </span>
                )}
              </div>

              {/* Text */}
              <div className="relative mt-5 flex-1">
                <h3 className="text-lg font-bold tracking-tight">
                  {topic.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {topic.description}
                </p>
              </div>

              {/* Bottom action */}
              <div className="relative mt-6 flex items-center justify-between border-t border-[var(--foam)]/80 pt-4">
                <span
                  className={`text-xs font-semibold ${
                    topic.available
                      ? "text-[var(--sea-ink)]"
                      : "text-muted-foreground"
                  }`}
                >
                  {topic.lessons}
                </span>

                {topic.available ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--sea-ink)] text-[var(--foam)] transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/70 text-muted-foreground/60">
                    <LockKeyhole className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </CardContent>
          );

          return topic.available ? (
            <Link
              key={topic.title}
              to="/learn"
              aria-label={`Start learning: ${topic.title}`}
              className="group block h-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--sea-ink)] focus-visible:ring-offset-4"
            >
              <Card className="relative h-full overflow-hidden rounded-3xl border-[var(--foam)] bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--sea-ink)]/20 hover:shadow-xl hover:shadow-[var(--sea-ink)]/5">
                {cardContent}
              </Card>
            </Link>
          ) : (
            <Card
              key={topic.title}
              aria-label={`${topic.title}, coming soon`}
              className="group relative h-full overflow-hidden rounded-3xl border-dashed border-[var(--foam)] bg-white/55 shadow-none transition-all duration-300 hover:bg-white/80"
            >
              {cardContent}
            </Card>
          );
        })}
      </div>

      {/* Small footer message */}
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--foam)]/50 px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
          <ArrowDownRight className="h-4 w-4 text-[var(--sea-ink)]" />
        </div>

        <p className="text-sm leading-5 text-muted-foreground">
          <span className="font-semibold text-[var(--sea-ink)]">
            Start small.
          </span>{" "}
          Master one topic at a time, then move on to the next.
        </p>
      </div>
    </section>
  );
}
