
import { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowDownRight } from "lucide-react";

import { PageState } from "@/components/common-ui/PageState";
import { useInfiniteWords, useWordCategories } from "@/hooks/use-words";
import { usePreferences } from "@/hooks/use-preferences";
import { useUpdateVocabularyState, useVocabularyState } from "@/hooks/use-vocabulary-state";
import type { DictionaryWord } from "@/lib/api/words";
import type { LearningState } from "@/lib/api/vocabulary";

import { DictionaryHeader } from "./DictionaryHeader";
import { DictionaryFilters } from "./DictionaryFilters";
import { FeaturedWord } from "./FeaturedWord";
import { VocabularyList } from "./VocabularyList";

type DictionaryOverviewProps = {
  initialCategory?: string;
  onCategoryChange?: (category: string) => void;
};

export function DictionaryOverview({
  initialCategory,
  onCategoryChange,
}: DictionaryOverviewProps) {
  const [query, setQuery] = useState("");
  const activeCategory = initialCategory ?? "All words";
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());
  const navigate = useNavigate();
  const preferences = usePreferences();
  const vocabulary = useVocabularyState();
  const updateVocabulary = useUpdateVocabularyState();
  const languageCode = preferences.data?.learning_language ?? "om";
  const categories = useWordCategories(languageCode);

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteWords({
    language_code: languageCode,
    category: activeCategory === "All words" ? undefined : activeCategory,
    search: deferredQuery || undefined,
    page_size: 20,
  });

  const words = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  const states = useMemo(
    () => Object.fromEntries((vocabulary.data?.data ?? []).map((item) => [item.word_id, item])),
    [vocabulary.data],
  );
  const favorites = useMemo(
    () => Object.values(states).filter((item) => item.is_favorite).map((item) => item.word_id),
    [states],
  );
  const featuredWord = words[0];

  const filteredWords = useMemo(
    () =>
      favoritesOnly
        ? words.filter((word) => favorites.includes(word.id))
        : words,
    [words, favoritesOnly, favorites],
  );
  const totalItems =
    data?.pages[data.pages.length - 1]?.meta.pagination.total_items ?? 0;

  function toggleFavorite(id: string) {
    updateVocabulary.mutate({ wordId: id, update: { is_favorite: !states[id]?.is_favorite } });
  }

  function setLearningState(id: string, learningState: LearningState) {
    updateVocabulary.mutate({ wordId: id, update: { learning_state: learningState } });
  }

  async function practiceWord(word: DictionaryWord) {
    try {
      await updateVocabulary.mutateAsync({
        wordId: word.id,
        update: { learning_state: "needs_review" },
      });
      await navigate({ to: "/review", search: { start: true } });
    } catch {
      // The mutation error is rendered below the filters.
    }
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
    onCategoryChange?.("All words");
    setFavoritesOnly(false);
  }

  function changeCategory(category: string) {
    onCategoryChange?.(category);
  }

  if (isPending || preferences.isPending || vocabulary.isPending || categories.isPending) {
    return <PageState kind="loading" title="Loading your vocabulary" />;
  }

  if (isError || preferences.isError || vocabulary.isError || categories.isError) {
    const loadError = error ?? preferences.error ?? vocabulary.error ?? categories.error;
    return <PageState kind="error" title="Couldn't load your dictionary" description={loadError instanceof Error ? loadError.message : "Something went wrong while loading vocabulary."} actionLabel="Try again" onAction={() => void Promise.all([refetch(), categories.refetch(), vocabulary.refetch()])} />;
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <DictionaryHeader />

      <DictionaryFilters
        query={query}
        onQueryChange={setQuery}
        activeCategory={activeCategory}
        onCategoryChange={changeCategory}
        categories={categories.data?.data ?? []}
      />

      {updateVocabulary.isError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {updateVocabulary.error.message}
        </p>
      )}

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
        states={states}
        onToggleFavoritesOnly={() =>
          setFavoritesOnly((current) => !current)
        }
        onToggleFavorite={toggleFavorite}
        onSetLearningState={setLearningState}
        onPlayAudio={playAudio}
        onPracticeWord={(word) => void practiceWord(word)}
        onClearFilters={clearFilters}
        totalItems={favoritesOnly ? filteredWords.length : totalItems}
        hasNextPage={Boolean(hasNextPage)}
        isLoadingMore={isFetchingNextPage}
        onLoadMore={() => void fetchNextPage()}
        updatingWordId={updateVocabulary.isPending ? updateVocabulary.variables?.wordId : undefined}
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
            Favorites and learning status are saved to your account.
          </p>
        </div>
      </footer>
    </main>
  );
}
