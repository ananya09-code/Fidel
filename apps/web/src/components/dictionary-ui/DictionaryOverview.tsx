
import { useMemo, useState } from "react";
import { ArrowDownRight } from "lucide-react";

import { useWords } from "@/hooks/use-words";
import type { DictionaryWord } from "@/lib/api/words";

import { DictionaryHeader } from "./DictionaryHeader";
import { DictionaryFilters } from "./DictionaryFilters";
import { FeaturedWord } from "./FeaturedWord";
import { VocabularyList } from "./VocabularyList";

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

    return words.filter((word: any) => {
      const matchesCategory =
        activeCategory === "All words" ||
        word.category.toLocaleLowerCase() ===
        activeCategory.toLocaleLowerCase();

      const searchableValues = [
        word.text,
        word.meaning,
        word.transliteration ?? "",
        word.category,
        word.content_type,
        word.difficulty,
        ...word.translations.map((translation: any) => translation.meaning),
        ...word.translations.map(
          (translation: any) => translation.context_note ?? "",
        ),
      ];

      const matchesQuery =
        !normalizedQuery ||
        searchableValues.some((value) =>
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
      // The audio URL may be unavailable or playback may be blocked.
    });
  }

  function clearFilters() {
    setQuery("");
    setActiveCategory("All words");
    setFavoritesOnly(false);
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
      <DictionaryHeader />

      <DictionaryFilters
        query={query}
        onQueryChange={setQuery}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {featuredWord &&
        !query &&
        !favoritesOnly &&
        activeCategory === "All words" && (
          <FeaturedWord
            word={featuredWord}
            isFavorite={favorites.includes(featuredWord.id)}
            onToggleFavorite={toggleFavorite}
            onPlayAudio={playAudio}
          />
        )}

      <VocabularyList
        words={filteredWords}
        favorites={favorites}
        favoritesOnly={favoritesOnly}
        onToggleFavoritesOnly={() =>
          setFavoritesOnly((current) => !current)
        }
        onToggleFavorite={toggleFavorite}
        onPlayAudio={playAudio}
        onPracticeWord={onPracticeWord}
        onClearFilters={clearFilters}
      />

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
            in component state and will reset when the page reloads.
          </p>
        </div>
      </footer>
    </main>
  );
}
