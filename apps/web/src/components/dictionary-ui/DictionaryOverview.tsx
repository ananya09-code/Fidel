
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Heart,
  Languages,
  Search,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";

import { useWords } from "@/hooks/use-words";
import type { DictionaryWord } from "@/lib/api/words";

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

type DictionaryOverviewProps = {
  onPracticeWord?: (word: DictionaryWord) => void;
};

export function DictionaryOverview({
  onPracticeWord,
}: DictionaryOverviewProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All words");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [expandedWord, setExpandedWord] = useState<string | null>(null);

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
  } = useWords({
    language: "om",
  });

  const words = data?.data ?? [];

  const featuredWord = words[0];

  const filteredWords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return words.filter((word) => {
      const matchesCategory =
        activeCategory === "All words" ||
        word.category.toLocaleLowerCase() ===
        activeCategory.toLocaleLowerCase();

      const matchesQuery =
        !normalizedQuery ||
        [
          word.text,
          word.meaning,
          word.transliteration ?? "",
          word.category,
          word.content_type,
          word.difficulty,
          ...word.translations.map((translation) => translation.meaning),
          ...word.translations.map(
            (translation) => translation.context_note ?? "",
          ),
        ].some((value) =>
          value.toLocaleLowerCase().includes(normalizedQuery),
        );

      const matchesFavorites =
        !favoritesOnly || favorites.includes(word.id);

      return matchesCategory && matchesQuery && matchesFavorites;
    });
  }, [words, query, activeCategory, favoritesOnly, favorites]);

  function toggleFavorite(id: string) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((favorite) => favorite !== id)
        : [...current, id],
    );
  }

  function playAudio(word: DictionaryWord) {
    const audioUrl = word.audio?.url;

    if (!word.audio?.available || !audioUrl) return;

    const audio = new Audio(audioUrl);

    void audio.play().catch(() => {
      // Playback can fail if the URL is unavailable or the browser blocks it.
    });
  }

  function getEnglishMeaning(word: DictionaryWord) {
    const englishTranslation = word.translations.find(
      (translation) => translation.language_code === "en",
    );

    return englishTranslation?.meaning || word.meaning;
  }

  if (isPending) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-[var(--sea-ink)]/65">
          Loading your vocabulary...
        </p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-[var(--sea-ink)]">
          Couldn't load your dictionary
        </h1>

        <p className="mt-2 text-sm text-[var(--sea-ink)]/65">
          {error instanceof Error
            ? error.message
            : "Something went wrong while loading vocabulary."}
        </p>

        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-5 rounded-xl bg-[var(--sea-ink)] px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
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
          <span>English</span>
        </div>
      </section>

      <section className="space-y-4">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--sea-ink)]/45"
          />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search words, meanings, or transliterations..."
            aria-label="Search dictionary"
            className="h-14 w-full rounded-2xl border border-[var(--sea-ink)]/10 bg-white/70 pl-12 pr-12 text-sm text-[var(--sea-ink)] outline-none transition placeholder:text-[var(--sea-ink)]/40 focus:border-[var(--sea-ink)]/30 focus:ring-4 focus:ring-[var(--sand)]/30"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
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
                onClick={() => setActiveCategory(category)}
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

      {featuredWord &&
        !query &&
        !favoritesOnly &&
        activeCategory === "All words" && (
          <section className="relative overflow-hidden rounded-3xl border border-[var(--sea-ink)]/10 bg-[var(--hero-a)] p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border-[32px] border-white/10" />
            <div className="pointer-events-none absolute -bottom-20 right-32 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div className="max-w-xl">
                <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sea-ink)]/60">
                  <Sparkles size={15} />
                  Word to explore
                </div>

                <p className="text-sm text-[var(--sea-ink)]/60">
                  {featuredWord.language_code}
                </p>

                <h2 className="mt-1 text-4xl font-semibold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
                  {featuredWord.text}
                </h2>

                {featuredWord.transliteration && (
                  <p className="mt-2 text-sm text-[var(--sea-ink)]/55">
                    {featuredWord.transliteration}
                  </p>
                )}

                <p className="mt-4 text-lg text-[var(--sea-ink)]">
                  {getEnglishMeaning(featuredWord)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleFavorite(featuredWord.id)}
                  aria-label={
                    favorites.includes(featuredWord.id)
                      ? "Remove featured word from favorites"
                      : "Add featured word to favorites"
                  }
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--sea-ink)]/15 bg-white/40 text-[var(--sea-ink)] transition hover:bg-white/70"
                >
                  <Heart
                    size={20}
                    fill={
                      favorites.includes(featuredWord.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>

                <button
                  type="button"
                  onClick={() => playAudio(featuredWord)}
                  disabled={
                    !featuredWord.audio?.available ||
                    !featuredWord.audio.url
                  }
                  title="Play pronunciation"
                  aria-label="Play featured word pronunciation"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sea-ink)] text-white transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Volume2 size={20} />
                </button>
              </div>
            </div>

            <div className="relative mt-6 flex items-center gap-2 text-xs text-[var(--sea-ink)]/55">
              <span className="rounded-full bg-white/40 px-2.5 py-1">
                {featuredWord.category}
              </span>
              <span>{featuredWord.difficulty}</span>
            </div>
          </section>
        )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--sea-ink)]">
              {favoritesOnly ? "Your favorites" : "Explore vocabulary"}
            </h2>
            <p className="mt-1 text-sm text-[var(--sea-ink)]/55">
              {filteredWords.length}{" "}
              {filteredWords.length === 1 ? "word" : "words"} found
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFavoritesOnly((current) => !current)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${favoritesOnly
              ? "border-[var(--sea-ink)] bg-[var(--sea-ink)] text-white"
              : "border-[var(--sea-ink)]/10 bg-white/50 text-[var(--sea-ink)]/70 hover:bg-[var(--sand)]/25"
              }`}
          >
            <Heart size={15} fill={favoritesOnly ? "currentColor" : "none"} />
            Favorites
            {favorites.length > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 text-xs">
                {favorites.length}
              </span>
            )}
          </button>
        </div>

        {filteredWords.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-[var(--sea-ink)]/10 bg-white/50">
            {filteredWords.map((word, index) => {
              const expanded = expandedWord === word.id;
              const favorite = favorites.includes(word.id);
              const englishMeaning = getEnglishMeaning(word);

              return (
                <article
                  key={word.id}
                  className={
                    index < filteredWords.length - 1
                      ? "border-b border-[var(--sea-ink)]/8"
                      : ""
                  }
                >
                  <div className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedWord(expanded ? null : word.id)
                      }
                      aria-label={`${expanded ? "Collapse" : "Expand"} ${word.text}`}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--sand)]/40 text-[var(--sea-ink)]">
                        <BookOpen size={19} strokeWidth={1.7} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-[var(--sea-ink)]">
                            {word.text}
                          </h3>

                          <span className="rounded-full bg-[var(--sea-ink)]/5 px-2 py-0.5 text-[10px] text-[var(--sea-ink)]/60">
                            {word.category}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-sm text-[var(--sea-ink)]/65">
                          {englishMeaning}
                        </p>

                        {word.transliteration && (
                          <p className="mt-1 text-xs text-[var(--sea-ink)]/40">
                            {word.transliteration}
                          </p>
                        )}
                      </div>

                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-[var(--sea-ink)]/45 transition-transform ${expanded ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(word.id)}
                        aria-label={
                          favorite
                            ? `Remove ${word.text} from favorites`
                            : `Add ${word.text} to favorites`
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--sea-ink)]/50 transition hover:bg-[var(--sand)]/40 hover:text-[var(--sea-ink)]"
                      >
                        <Heart
                          size={17}
                          fill={favorite ? "currentColor" : "none"}
                          className={favorite ? "text-rose-500" : ""}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => playAudio(word)}
                        disabled={
                          !word.audio?.available || !word.audio.url
                        }
                        aria-label={`Play ${word.text} pronunciation`}
                        title={
                          word.audio?.available
                            ? "Play pronunciation"
                            : "Audio not available"
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--sea-ink)]/50 transition hover:bg-[var(--sand)]/40 disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        <Volume2 size={17} />
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-[var(--sea-ink)]/8 bg-[var(--sand)]/10 px-4 py-4 sm:px-5 sm:pl-[4.5rem]">
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-[var(--sea-ink)]/45">
                          Meaning
                        </p>
                        <p className="text-sm font-medium text-[var(--sea-ink)]">
                          {word.meaning}
                        </p>
                      </div>

                      {word.translations.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wider text-[var(--sea-ink)]/45">
                            Translations
                          </p>

                          {word.translations.map((translation, translationIndex) => (
                            <div
                              key={`${translation.language_code}-${translationIndex}`}
                              className="text-sm text-[var(--sea-ink)]/70"
                            >
                              <span className="font-medium">
                                {translation.language_code}:
                              </span>{" "}
                              {translation.meaning}
                              {translation.context_note && (
                                <p className="mt-1 text-xs text-[var(--sea-ink)]/55">
                                  {translation.context_note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-[var(--sea-ink)]/45">
                          {word.audio?.available && word.audio.url
                            ? "Audio pronunciation available"
                            : "No audio available"}
                        </span>

                        <button
                          type="button"
                          onClick={() => onPracticeWord?.(word)}
                          className="inline-flex items-center gap-2 rounded-xl bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-85"
                        >
                          Practice this word
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--sea-ink)]/15 bg-white/30 px-5 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--sand)]/40 text-[var(--sea-ink)]/60">
              {favoritesOnly ? <Heart size={21} /> : <Search size={21} />}
            </div>

            <h3 className="mt-4 font-semibold text-[var(--sea-ink)]">
              {favoritesOnly ? "No favorites yet" : "No words found"}
            </h3>

            <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--sea-ink)]/55">
              {favoritesOnly
                ? "Tap the heart beside a word to save it here for later."
                : "Try another search term or choose a different category."}
            </p>

            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategory("All words");
                setFavoritesOnly(false);
              }}
              className="mt-4 rounded-xl border border-[var(--sea-ink)]/10 px-4 py-2 text-sm text-[var(--sea-ink)] transition hover:bg-[var(--sand)]/30"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <footer className="flex items-start gap-3 rounded-2xl border border-[var(--sea-ink)]/8 bg-white/30 p-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--sand)]/40 text-[var(--sea-ink)]">
          <ArrowDownRight size={17} />
        </div>

        <div>
          <p className="text-sm font-medium text-[var(--sea-ink)]">
            Your vocabulary
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--sea-ink)]/55">
            Words are loaded from the Fidel API. Favorites are currently saved
            in component state and will reset when this component remounts or
            the page reloads.
          </p>
        </div>
      </footer>
    </main>
  );
}
