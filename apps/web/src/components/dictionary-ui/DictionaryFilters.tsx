
import { Search, X } from "lucide-react";

import type { WordCategory } from "@/lib/api/words";

type DictionaryFiltersProps = {
  query: string;
  onQueryChange: (query: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categories: WordCategory[];
};

export function DictionaryFilters({
  query,
  onQueryChange,
  activeCategory,
  onCategoryChange,
  categories,
}: DictionaryFiltersProps) {
  const options = [{ name: "All words", word_count: 0 }, ...categories];
  return (
    <section className="space-y-4">
      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--sea-ink)]/45"
        />

        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search words, meanings, or transliterations..."
          aria-label="Search dictionary"
          className="h-14 w-full rounded-2xl border border-[var(--sea-ink)]/10 bg-white/70 pl-12 pr-12 text-sm text-[var(--sea-ink)] outline-none transition placeholder:text-[var(--sea-ink)]/40 focus:border-[var(--sea-ink)]/30 focus:ring-4 focus:ring-[var(--sand)]/30"
        />

        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--sea-ink)]/50 hover:bg-[var(--sand)]/30"
          >
            <X size={17} />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {options.map((category) => {
          const active = activeCategory === category.name;

          return (
            <button
              key={category.name}
              type="button"
              onClick={() => onCategoryChange(category.name)}
              aria-pressed={active}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${active
                  ? "bg-[var(--sea-ink)] text-white"
                  : "border border-[var(--sea-ink)]/10 bg-white/40 text-[var(--sea-ink)]/70 hover:bg-[var(--sand)]/30"
                }`}
            >
              {category.name}
              {category.name !== "All words" && (
                <span className="ml-1 opacity-60">{category.word_count}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
