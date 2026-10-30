
import { BookOpen, Languages } from "lucide-react";

export function DictionaryHeader() {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--sand)] bg-[var(--sand)]/20 px-3 py-1.5 text-xs font-medium text-[var(--sea-ink)]">
          <BookOpen size={14} />
          Your vocabulary library
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          Dictionary
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--sea-ink)]/65 sm:text-base">
          Find a word, understand its meaning, and grow your everyday
          vocabulary.
        </p>
      </div>

      <div className="flex items-center gap-2 self-start rounded-xl border border-[var(--sea-ink)]/10 bg-white/50 px-3 py-2 text-sm text-[var(--sea-ink)]/70 sm:self-auto">
        <Languages size={17} />
        <span>Afaan Oromoo</span>
        <span className="text-[var(--sea-ink)]/30">→</span>
        <span>English + Amharic</span>
      </div>
    </section>
  );
}
