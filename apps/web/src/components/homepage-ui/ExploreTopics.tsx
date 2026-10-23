
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Coffee,
  LockKeyhole,
  MessageCircle,
  Utensils,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const topics = [
  {
    title: "Greetings",
    description:
      "Learn how to say hello, introduce yourself, and start everyday conversations.",
    icon: MessageCircle,
    number: "01",
    available: true,
    lessons: "Beginner",
  },
  {
    title: "Daily life",
    description:
      "Talk about your routine, daily activities, and everyday situations.",
    icon: Coffee,
    number: "02",
    available: false,
    lessons: "Coming soon",
  },
  {
    title: "Food & drinks",
    description:
      "Learn food vocabulary and useful phrases for ordering meals.",
    icon: Utensils,
    number: "03",
    available: false,
    lessons: "Coming soon",
  },
  {
    title: "People & family",
    description:
      "Talk about your family, friends, and the people around you.",
    icon: Users,
    number: "04",
    available: false,
    lessons: "Coming soon",
  },
];

export function ExploreTopics() {
  const availableTopics = topics.filter((topic) => topic.available).length;

  return (
    <section className="space-y-6">
      {/* Section heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Explore your learning path
          </p>

          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Learn by topic
          </h2>

          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Start with useful words and phrases, then build your confidence
            one conversation at a time.
          </p>
        </div>

        <Badge
          variant="secondary"
          className="w-fit rounded-full px-3 py-1.5 font-medium"
        >
          {availableTopics} of {topics.length} available
        </Badge>
      </div>

      {/* Topic cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topics.map((topic) => {
          const Icon = topic.icon;

          const content = (
            <CardContent className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${topic.available
                      ? "bg-[var(--sea-ink)] text-[var(--foam)]"
                      : "bg-muted text-muted-foreground"
                    }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>

                {topic.available ? (
                  <Badge
                    variant="secondary"
                    className="gap-1 rounded-full"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Available
                  </Badge>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Coming soon
                  </span>
                )}
              </div>

              <div className="mt-5 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  TOPIC {topic.number}
                </p>

                <h3 className="mt-1 text-lg font-semibold tracking-tight">
                  {topic.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {topic.description}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t pt-4">
                <span className="text-sm font-medium text-muted-foreground">
                  {topic.lessons}
                </span>

                {topic.available ? (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--sea-ink)] text-[var(--foam)] transition-transform group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/70 text-muted-foreground"
                  >
                    <LockKeyhole className="h-4 w-4" />
                  </span>
                )}
              </div>
            </CardContent>
          );

          if (topic.available) {
            return (
              <Link
                key={topic.title}
                to="/learn"
                aria-label={`Start learning: ${topic.title}`}
                className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--sea-ink)] focus-visible:ring-offset-2"
              >
                <Card className="h-full rounded-2xl border bg-card transition-colors hover:border-[var(--sea-ink)]/30 hover:bg-accent/30">
                  {content}
                </Card>
              </Link>
            );
          }

          return (
            <Card
              key={topic.title}
              aria-label={`${topic.title}, coming soon`}
              className="h-full rounded-2xl border-dashed bg-muted/20"
            >
              {content}
            </Card>
          );
        })}
      </div>

      {/* Supporting message */}
      <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <BookOpen className="h-5 w-5 text-[var(--sea-ink)]" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold">One topic at a time</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Begin with greetings and build a foundation you can use in real
            conversations.
          </p>
        </div>
      </div>
    </section>
  );
}
