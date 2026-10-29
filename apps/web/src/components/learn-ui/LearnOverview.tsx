
import { ArrowUpRight, Clock3, Headphones } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function LearnOverview() {
  return (
    <section className="space-y-7 sm:space-y-10">
      {/* Language heading */}
      <header className="relative">
        <div className="flex items-center gap-2">
          <span className="h-px w-7 bg-[var(--hero-a)] sm:w-9" />

          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--sea-ink)]/60 sm:text-[11px]">
            Your language journey
          </p>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-5 min-[480px]:flex-row min-[480px]:items-end sm:mt-5">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold leading-[1.08] tracking-[-0.055em] text-[var(--sea-ink)] min-[420px]:text-4xl sm:text-5xl lg:text-6xl">
              Afaan Oromoo<span className="text-[var(--hero-a)]">.</span>
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--sea-ink)]/65 sm:text-base sm:leading-7">
              Every word brings you closer
              <br className="hidden min-[420px]:block" /> to a real conversation.
            </p>
          </div>

          {/* Current level */}
          <div className="flex w-fit items-center gap-3 rounded-2xl border border-[var(--sea-ink)]/10 bg-[var(--foam)]/50 px-3.5 py-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--hero-a)]/20 text-sm font-semibold text-[var(--sea-ink)]">
              01
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--sea-ink)]">
                Beginner
              </p>
              <p className="mt-0.5 text-xs text-[var(--sea-ink)]/55">
                Your first steps
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Featured lesson */}
      <article className="relative isolate overflow-hidden rounded-[1.6rem] bg-[var(--sea-ink)] text-[var(--foam)] shadow-sm sm:rounded-[2rem]">
        {/* Subtle decorative background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full border border-[var(--foam)]/[0.08] sm:-right-12 sm:-top-28 sm:h-80 sm:w-80"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 top-8 -z-10 h-40 w-40 rounded-full border border-[var(--foam)]/[0.08] sm:right-8 sm:top-12 sm:h-52 sm:w-52"
        />

        <div className="grid sm:grid-cols-[minmax(0,1fr)_200px] lg:grid-cols-[minmax(0,1fr)_250px]">
          {/* Lesson information */}
          <div className="min-w-0 p-5 sm:p-7 lg:p-9">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--foam)]/15 bg-[var(--foam)]/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--foam)]/85 sm:text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--hero-a)]" />
                Up next
              </span>

              <span className="text-xs text-[var(--foam)]/45">
                Lesson 01
              </span>
            </div>

            <h2 className="mt-6 max-w-md text-[2rem] font-semibold leading-[1.08] tracking-[-0.055em] min-[420px]:text-4xl sm:mt-7 sm:text-5xl lg:text-[3.4rem]">
              Start with
              <br />
              <span className="text-[var(--hero-b)]">
                a simple hello.
              </span>
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--foam)]/65 sm:text-base sm:leading-7">
              Learn your first greetings and discover how to start a
              conversation in Afaan Oromoo.
            </p>

            {/* Lesson details */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-[var(--foam)]/70 sm:text-sm">
              <span className="inline-flex items-center gap-2">
                <Headphones
                  aria-hidden="true"
                  className="h-4 w-4 text-[var(--hero-a)]"
                />
                5 words
              </span>

              <span className="inline-flex items-center gap-2">
                <Clock3
                  aria-hidden="true"
                  className="h-4 w-4 text-[var(--hero-a)]"
                />
                3 min
              </span>
            </div>

            <div className="mt-7 sm:mt-8">
              <Link
                to="/Learn"
                className="group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-[var(--foam)] px-6 text-sm font-semibold text-[var(--sea-ink)] transition duration-200 hover:bg-[var(--hero-b)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hero-a)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sea-ink)] sm:w-auto sm:justify-start"
              >
                Begin lesson

                <ArrowUpRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>
          </div>

          {/* Decorative lesson artwork */}
          <div className="relative flex min-h-[155px] items-center justify-center overflow-hidden border-t border-[var(--foam)]/10 sm:min-h-full sm:border-l sm:border-t-0">
            {/* Orbital rings */}
            <div
              aria-hidden="true"
              className="absolute h-36 w-36 rounded-full border border-[var(--foam)]/10 sm:h-44 sm:w-44 lg:h-52 lg:w-52"
            />

            <div
              aria-hidden="true"
              className="absolute h-28 w-28 rounded-full border border-[var(--foam)]/15 sm:h-32 sm:w-32 lg:h-40 lg:w-40"
            />

            {/* Main lesson tile */}
            <div className="relative flex h-[5.25rem] w-[5.25rem] rotate-[-7deg] items-center justify-center rounded-[1.5rem] bg-[var(--hero-a)] text-4xl font-semibold text-[var(--sea-ink)] shadow-xl shadow-black/10 sm:h-24 sm:w-24 sm:rounded-[1.8rem] sm:text-5xl lg:h-28 lg:w-28 lg:text-6xl">
              A

              <span className="absolute -right-2 -top-2 flex h-8 w-8 rotate-[12deg] items-center justify-center rounded-full border-[3px] border-[var(--sea-ink)] bg-[var(--foam)] text-[10px] font-bold text-[var(--sea-ink)] sm:h-9 sm:w-9">
                01
              </span>
            </div>

            {/* Artwork caption */}
            <span className="absolute bottom-4 right-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--foam)]/40 sm:bottom-6 sm:right-6 sm:text-[10px]">
              One word at a time
            </span>
          </div>
        </div>
      </article>
    </section>
  );
}
