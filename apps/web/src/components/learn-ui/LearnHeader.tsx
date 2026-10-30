export function LearnHeader() {
  return (
    <section className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sea-ink)]/50">
          Learn
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          Afaan Oromoo
        </h1>

        <p className="mt-2 text-sm text-[var(--sea-ink)]/60">
          Your journey starts with a few simple words.
        </p>
      </div>

      <span className="inline-flex items-center rounded-full border border-[var(--sea-ink)]/10 bg-white/60 px-3 py-1.5 text-sm font-medium text-[var(--sea-ink)]">
        Beginner
      </span>
    </section>
  );
}
