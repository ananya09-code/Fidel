
import { Search, X } from "lucide-react";

const categories = [
  "All words",
  "Greetings",
  "Everyday",
  "Questions",
  "Food & Drink",
  "Places",
  "Family",
  "Numbers",
];

type DictionaryFiltersProps = {
  query: string;
  onQueryChange: (query: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
};

export function DictionaryFilters({
  query,
  onQueryChange,
  activeCategory,
  onCategoryChange,
}: DictionaryFiltersProps) {
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
        {categories.map((category) => {
          const active = activeCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              aria-pressed={active}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${active
                  ? "bg-[var(--sea-ink)] text-white"
                  : "border border-[var(--sea-ink)]/10 bg-white/40 text-[var(--sea-ink)]/70 hover:bg-[var(--sand)]/30"
                }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </section>
  );
}
