
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[var(--sea-ink)] px-6 py-8 text-[var(--foam)] sm:px-10 sm:py-10">
      <div className="relative z-10 flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
        <div className="max-w-2xl space-y-5">
          <Badge
            variant="outline"
            className="border-[var(--foam)]/20 bg-[var(--foam)]/10 text-[var(--foam)]"
          >
            Your learning journey
          </Badge>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Every word brings you closer.
            </h1>

            <p className="max-w-lg text-sm leading-6 text-[var(--foam)]/70 sm:text-base">
              Build your vocabulary, practice pronunciation, and learn
              Ethiopian languages one lesson at a time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-[var(--foam)] text-[var(--sea-ink)] hover:bg-[var(--foam)]/90"
            >
              <Link to="/learn">
                Continue learning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-[var(--foam)]/20 bg-transparent text-[var(--foam)] hover:bg-[var(--foam)]/10 hover:text-[var(--foam)]"
            >
              <Link to="/dictionary">
                <BookOpen className="mr-2 h-4 w-4" />
                Explore words
              </Link>
            </Button>
          </div>
        </div>

        <div className="hidden shrink-0 items-center justify-center sm:flex">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[var(--foam)]/15 bg-[var(--foam)]/5">
            <span
              className="text-5xl font-bold text-[var(--sand)]"
              aria-label="Amharic character ፊ"
            >
              ፊ
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
