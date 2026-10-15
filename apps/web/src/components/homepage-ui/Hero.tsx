import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function Hero() {
  return (
    <section className="grid items-center gap-10 overflow-hidden rounded-3xl bg-[var(--sea-ink)] p-6 text-[var(--foam)] sm:p-10 lg:grid-cols-2 lg:p-14">
      {/* Left: Introduction */}
      <div className="space-y-6">
        <Badge
          variant="outline"
          className="border-[var(--foam)]/30 bg-[var(--foam)]/10 px-3 py-1 text-[var(--foam)]"
        >
          Learn at your own pace
        </Badge>

        <div className="space-y-4">
          <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Discover a language.
            <span className="mt-2 block text-orange-400">
              Connect with a culture.
            </span>{" "}
          </h1>

          <p className="max-w-md text-base leading-7 text-[var(--foam)]/75 sm:text-lg">
            Learn Ethiopian languages through short lessons, useful everyday
            words, and authentic pronunciation.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="bg-[var(--foam)] text-[var(--sea-ink)] hover:bg-[var(--foam)]/90"
          >
            <Link to="/learn">
              Start learning
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-[var(--foam)]/30 bg-transparent text-[var(--foam)] hover:bg-[var(--foam)]/10 hover:text-[var(--foam)]"
          >
            <Link to="/dictionary">
              <BookOpen className="mr-2 h-4 w-4" />
              Explore words
            </Link>
          </Button>
        </div>
      </div>

      {/* Right: Featured word */}
      <div className="mx-auto w-full max-w-sm">
        <Card className="rotate-[-2deg] border-0 bg-[var(--sand)] text-[var(--sea-ink)] shadow-xl">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <Badge className="bg-[var(--sea-ink)]/10 text-[var(--sea-ink)] hover:bg-[var(--sea-ink)]/10">
                YOUR FIRST WORD
              </Badge>

              <span className="text-xs font-medium opacity-60">
                Afaan Oromoo
              </span>
            </div>

            <div className="py-10 text-center">
              <h2 className="text-5xl font-bold tracking-tight sm:text-6xl">
                Akkam
              </h2>

              <p className="mt-3 text-sm opacity-60">/ ak-kam /</p>

              <p className="mt-5 text-lg font-medium">Hello · How are you?</p>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-white/50 p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--sea-ink)] text-[var(--foam)]">
                <Volume2 className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-semibold">Listen and learn</p>
                <p className="text-xs opacity-60">Learn how the word sounds</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-sm text-[var(--foam)]/60">
          Every word brings you closer.
        </p>
      </div>
    </section>
  );
}
