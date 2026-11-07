import {readFileSync,writeFileSync} from 'node:fs';
const file='web/src/components/dictionary-ui/DictionaryOverview.tsx';
let s=readFileSync(file,'utf8').replace('useDeferredValue, useMemo, useState','useDeferredValue, useEffect, useMemo, useRef, useState').replace('import { ArrowDownRight } from "lucide-react";','import "./dictionary.css";');
s=s.replace('  const [query, setQuery] = useState("");','  const [query, setQuery] = useState("");\n  const [audioNotice, setAudioNotice] = useState<string | null>(null);\n  const audioPlayer = useRef<HTMLAudioElement | null>(null);');
s=s.replace('  const languageCode = preferences.data?.learning_language ?? "om";','  const languageCode = preferences.data?.learning_language ?? "om";\n  useEffect(() => () => { audioPlayer.current?.pause(); }, [languageCode]);');
const start=s.indexOf('  function playAudio('),end=s.indexOf('  function clearFilters()',start);
s=s.slice(0,start)+`  function playAudio(word: DictionaryWord) {
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

`+s.slice(end);
const render=s.indexOf('  if (isPending ||');
s=s.slice(0,render)+`
  const loading = isPending || preferences.isPending || vocabulary.isPending || categories.isPending;
  const failed = isError || preferences.isError || vocabulary.isError || categories.isError;
  const loadError = error ?? preferences.error ?? vocabulary.error ?? categories.error;
  const showFeatured = !loading && !failed && featuredWord && !query && !favoritesOnly && activeCategory === "All words";

  return <div className="fidel-dictionary">
    <DictionaryHeader languageCode={languageCode} />
    <DictionaryFilters query={query} onQueryChange={setQuery} activeCategory={activeCategory} onCategoryChange={changeCategory} categories={categories.data?.data ?? []} />
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
`;
writeFileSync(file,s);
