
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import "./dictionary.css";

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
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const activeCategory = initialCategory ?? "All words";
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());
  const navigate = useNavigate();
  const preferences = usePreferences();
  const vocabulary = useVocabularyState();
  const updateVocabulary = useUpdateVocabularyState();
  const languageCode = preferences.data?.learning_language ?? "om";
  useEffect(() => () => { audioPlayer.current?.pause(); }, [languageCode]);
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
    const url = word.audio?.url;
    if (!word.audio?.available || !url) return;
    audioPlayer.current?.pause();
    const player = new Audio(url);
    audioPlayer.current = player;
    setAudioNotice(null);
    void player.play().catch(() => {
      if (audioPlayer.current === player) setAudioNotice("Couldn’t play " + word.text + ". Try listening again.");
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


  const loading = isPending || preferences.isPending || vocabulary.isPending || categories.isPending;
  const failed = isError || preferences.isError || vocabulary.isError || categories.isError;
  const loadError = error ?? preferences.error ?? vocabulary.error ?? categories.error;
  const showFeatured = !loading && !failed && featuredWord && !query && !favoritesOnly && activeCategory === "All words";

  return <div className="fidel-dictionary">
    <DictionaryHeader languageCode={languageCode} />
    <DictionaryFilters query={query} onQueryChange={setQuery} activeCategory={activeCategory} onCategoryChange={changeCategory} categories={categories.data?.data ?? []} guideReady={!loading && !failed} />
    {updateVocabulary.isError && <p className="dict-error" role="alert">{updateVocabulary.error.message}</p>}
    {audioNotice && <p className="dict-error" role="alert">{audioNotice}</p>}
    <div className={"dict-layout" + (showFeatured ? " has-feature" : "")}>
      {loading ? <PageState kind="loading" title="Loading your vocabulary" /> : failed ? <PageState kind="error" title="Couldn't load your dictionary" description={loadError instanceof Error ? loadError.message : "Something went wrong while loading vocabulary."} actionLabel="Try again" onAction={() => void Promise.all([refetch(), preferences.refetch(), categories.refetch(), vocabulary.refetch()])} /> : <VocabularyList
        words={filteredWords} favorites={favorites} favoritesOnly={favoritesOnly} states={states}
        onToggleFavoritesOnly={() => setFavoritesOnly((current) => !current)}
        onToggleFavorite={toggleFavorite} onSetLearningState={setLearningState} onPlayAudio={playAudio}
        onPracticeWord={(word) => void practiceWord(word)} onClearFilters={clearFilters}
        totalItems={totalItems} hasNextPage={Boolean(hasNextPage)} isLoadingMore={isFetchingNextPage}
        onLoadMore={() => void fetchNextPage()}
        updatingWordId={updateVocabulary.isPending ? updateVocabulary.variables?.wordId : undefined}
      />}
      {showFeatured && <FeaturedWord word={featuredWord} isFavorite={favorites.includes(featuredWord.id)} onToggleFavorite={toggleFavorite} onPlayAudio={playAudio} isUpdating={updateVocabulary.isPending} />}
    </div>
    <p className="dict-save-note">Favorites and word progress are saved to your account.</p>
  </div>;
}
