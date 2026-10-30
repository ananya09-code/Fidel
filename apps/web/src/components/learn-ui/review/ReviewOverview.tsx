import { ArrowRight, BookOpen, CheckCircle2, RotateCcw } from "lucide-react";

import type { ReviewOverview as ReviewData } from "@/lib/api/reviews";
import { PageState } from "@/components/common-ui/PageState";

type Props = {
  data: ReviewData;
  onStart: () => void;
  isStarting?: boolean;
  error?: string | null;
};

export function ReviewOverview({ data, onStart, isStarting = false, error }: Props) {
  const categories = new Map<string, number>();
  for (const word of data.queue) {
    categories.set(word.category, (categories.get(word.category) ?? 0) + 1);
  }
  const latest = data.history[0];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-[var(--sea-ink)]/55">YOUR LEARNING JOURNEY</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">Review</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--sea-ink)]/65 sm:text-base">
          Practise words you missed and move them back to learned when you remember them.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Review overview">
        <Stat icon={<RotateCcw className="size-5" />} label="To review" value={data.queue.length} />
        <Stat icon={<CheckCircle2 className="size-5" />} label="Sessions completed" value={data.history.length} />
        <Stat
          icon={<BookOpen className="size-5" />}
          label="Last score"
          value={latest ? `${latest.correct_count}/${latest.total_count}` : "—"}
        />
      </section>

      <section className="mt-6 rounded-3xl border border-[var(--sea-ink)]/10 bg-white p-6 shadow-sm sm:p-9">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-[var(--sea-ink)]">
              {data.active_session ? "Continue your review" : "Ready to practise?"}
            </h2>
            <p className="mt-2 text-sm text-[var(--sea-ink)]/60">
              {data.active_session
                ? `${data.active_session.answers.length} of ${data.active_session.total_count} answered`
                : `${data.queue.length} ${data.queue.length === 1 ? "word" : "words"} waiting`}
            </p>
          </div>
          <button
            type="button"
            disabled={isStarting || (!data.active_session && data.queue.length === 0)}
            onClick={onStart}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--sea-ink)] px-6 text-sm font-semibold text-white disabled:opacity-40"
          >
            {isStarting ? "Starting..." : data.active_session ? "Continue review" : "Start review"}
            <ArrowRight className="size-4" />
          </button>
        </div>
        {error && <p className="mt-4 text-sm text-rose-700" role="alert">{error}</p>}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-[var(--sea-ink)]">Words to revisit</h2>
        {data.queue.length === 0 ? (
          <div className="mt-4">
            <PageState kind="empty" title="You're all caught up" description="Nothing needs review right now." compact />
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--sea-ink)]/10 bg-white">
            {data.queue.map((word, index) => (
              <div key={word.id} className={`flex items-center justify-between gap-4 p-4 ${index ? "border-t border-[var(--sea-ink)]/10" : ""}`}>
                <div>
                  <p className="font-semibold text-[var(--sea-ink)]">{word.text}</p>
                  <p className="mt-1 text-sm text-[var(--sea-ink)]/60">
                    English: {word.meaning}
                  </p>
                  <p className="mt-1 text-sm text-[var(--sea-ink)]/60">
                    Amharic: {word.amharic ?? "Translation unavailable"}
                  </p>
                </div>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">Needs review</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {categories.size > 0 && (
        <p className="mt-5 text-xs text-[var(--sea-ink)]/50">
          {Array.from(categories).map(([name, count]) => `${name}: ${count}`).join(" · ")}
        </p>
      )}
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <article className="rounded-2xl border border-[var(--sea-ink)]/10 bg-white p-5">
      <div className="flex items-center justify-between"><span className="text-sm text-[var(--sea-ink)]/65">{label}</span><span className="text-[var(--sea-ink)]">{icon}</span></div>
      <p className="mt-3 text-3xl font-bold text-[var(--sea-ink)]">{value}</p>
    </article>
  );
}
