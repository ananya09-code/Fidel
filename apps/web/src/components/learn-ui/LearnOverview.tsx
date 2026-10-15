import { ArrowUpRight, Clock3, Headphones } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function LearnOverview() {
  return (
    <section className="space-y-6 sm:space-y-9">
      {/* Language heading */}
      <header>
        <div className="flex items-center gap-2">
          <span className="h-px w-6 bg-[var(--sea-ink)]/40 sm:w-8" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink)]/65 sm:text-[11px] sm:tracking-[0.24em]">
            Your language journey
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4 sm:mt-5">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold leading-tight tracking-[-0.045em] text-[var(--sea-ink)] min-[420px]:text-4xl sm:text-5xl lg:text-6xl">
              Afaan Oromoo<span className="text-[var(--hero-a)]">.</span>
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--sea-ink)]/65 sm:mt-3 sm:text-base">
              New words. New connections.
              <br className="hidden min-[420px]:block" />A little closer to
              speaking every day.
            </p>
          </div>

          <div className="flex items-center gap-2.5 pb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--sea-ink)]/15 text-xs font-semibold text-[var(--sea-ink)] sm:h-11 sm:w-11 sm:text-sm">
              01
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--sea-ink)]">
                Beginner
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Your starting point
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Featured lesson */}
      <article className="relative isolate overflow-hidden rounded-[1.5rem] bg-[var(--sea-ink)] text-[var(--foam)] sm:rounded-[2rem]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 -top-7 -z-10 select-none text-[9rem] font-bold leading-none tracking-[-0.1em] opacity-[0.06] sm:-right-1 sm:-top-12 sm:text-[15rem] lg:text-[17rem]"
        >
          A
        </div>

        <div className="grid sm:grid-cols-[minmax(0,1fr)_180px] lg:grid-cols-[minmax(0,1fr)_230px]">
          <div className="min-w-0 p-5 sm:p-7 lg:p-9">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-[var(--foam)]/65 sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-[var(--hero-a)]" />
              UP NEXT
              <span className="text-[var(--foam)]/30">/</span>
              LESSON 01
            </div>

            <h2 className="mt-5 max-w-md text-[1.7rem] font-semibold leading-[1.12] tracking-[-0.04em] min-[420px]:text-3xl sm:mt-7 sm:text-4xl lg:text-[2.75rem]">
              Start with
              <br />
              <span className="text-[var(--hero-b)]">a simple hello.</span>
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--foam)]/70 sm:mt-4">
              Learn greetings and introductions, and take your first step toward
              a real conversation in Afaan Oromoo.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2.5 text-xs text-[var(--foam)]/70 sm:mt-6 sm:gap-x-5 sm:text-sm">
              <span className="inline-flex items-center gap-2">
                <Headphones className="h-4 w-4 shrink-0" />5 words
              </span>

              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 shrink-0" />3 minutes
              </span>
            </div>

            <Link
              to="/learn"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-full bg-[var(--foam)] px-5 text-sm font-semibold text-[var(--sea-ink)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hero-a)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sea-ink)] sm:mt-8 sm:w-auto sm:justify-start sm:gap-5"
            >
              Begin lesson
              <ArrowUpRight className="h-4 w-4 shrink-0" />
            </Link>
          </div>

          {/* Decorative lesson illustration */}
          <div className="relative flex min-h-[125px] items-center justify-center overflow-hidden border-t border-[var(--foam)]/10 sm:min-h-full sm:border-l sm:border-t-0">
            <div
              aria-hidden="true"
              className="absolute h-32 w-32 rounded-full border border-[var(--foam)]/15 sm:h-40 sm:w-40 lg:h-48 lg:w-48"
            />

            <div
              aria-hidden="true"
              className="absolute h-24 w-24 rounded-full border border-[var(--foam)]/20 sm:h-28 sm:w-28 lg:h-36 lg:w-36"
            />

            <div className="relative flex h-[4.5rem] w-[4.5rem] rotate-[-7deg] items-center justify-center rounded-[1.4rem] bg-[var(--hero-a)] text-3xl font-semibold text-[var(--sea-ink)] shadow-xl sm:h-24 sm:w-24 sm:rounded-[1.7rem] sm:text-4xl lg:h-28 lg:w-28 lg:text-5xl">
              A
              <span className="absolute -right-2 -top-2 flex h-7 w-7 rotate-[12deg] items-center justify-center rounded-full bg-[var(--foam)] text-[10px] font-bold text-[var(--sea-ink)] sm:h-9 sm:w-9 sm:text-xs">
                01
              </span>
            </div>

            <span className="absolute bottom-3 right-4 text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--foam)]/40 sm:bottom-6 sm:right-6 sm:text-[10px]">
              LET'S BEGIN
            </span>
          </div>
        </div>
      </article>
    </section>
  );
}
