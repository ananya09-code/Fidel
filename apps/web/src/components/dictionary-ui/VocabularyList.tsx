import { useId, useState } from "react";
import { ArrowRight, Check, ChevronDown, Heart, LoaderCircle, Volume2 } from "lucide-react";
import { topicLabel } from "@/components/homepage-ui/labels";
import type { DictionaryWord } from "@/lib/api/words";
import type { LearningState, VocabularyState } from "@/lib/api/vocabulary";

type VocabularyListProps = {
  words: DictionaryWord[];
  favorites: string[];
  favoritesOnly: boolean;
  states: Record<string, VocabularyState>;
  onToggleFavoritesOnly: () => void;
  onToggleFavorite: (id: string) => void;
  onSetLearningState: (id: string, state: LearningState) => void;
  onPlayAudio: (word: DictionaryWord) => void;
  onPracticeWord?: (word: DictionaryWord) => void;
  onClearFilters: () => void;
  totalItems: number;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  updatingWordId?: string;
};

export function VocabularyList({
  words, favorites, favoritesOnly, states, onToggleFavoritesOnly, onToggleFavorite,
  onSetLearningState, onPlayAudio, onPracticeWord, onClearFilters, totalItems,
  hasNextPage, isLoadingMore, onLoadMore, updatingWordId,
}: VocabularyListProps) {
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const detailId = useId();
  return <section className="dict-vocabulary" aria-labelledby="dict-list-title">
    <div className="dict-list-heading"><div><h2 id="dict-list-title">{favoritesOnly ? "Your favorites" : "Explore words"}</h2><p aria-live="polite">{favoritesOnly ? words.length + " favorites in loaded words" : words.length + " of " + totalItems + " words"}</p></div><button type="button" className="dict-favorite-filter" aria-pressed={favoritesOnly} onClick={onToggleFavoritesOnly}><Heart size={16} fill={favoritesOnly ? "currentColor" : "none"} aria-hidden="true" />Favorites</button></div>
    {words.length ? <div className="dict-word-list">{words.map((word, index) => {
      const expanded = expandedWord === word.id;
      const favorite = favorites.includes(word.id);
      const state = states[word.id]?.learning_state ?? "learning";
      const busy = Boolean(updatingWordId);
      const english = word.translations.find((item) => item.language_code === "en")?.meaning ?? word.meaning;
      const amharic = word.translations.find((item) => item.language_code === "am")?.meaning;
      const id = detailId + "-" + index;
      return <article className={"dict-word-row" + (expanded ? " is-open" : "")} key={word.id}>
        <div className="dict-row-main">
          <button type="button" className="dict-entry" aria-expanded={expanded} aria-controls={id} onClick={() => setExpandedWord(expanded ? null : word.id)} aria-label={(expanded ? "Collapse " : "Expand ") + word.text}>
            <span className="dict-word-identity"><span className="dict-word-text">{word.text}</span><span className="dict-meta">{topicLabel(word.category)}{state !== "learning" && <span className="dict-word-status">{state === "learned" ? "Learned" : "Needs review"}</span>}</span></span>
            <span className="dict-row-meanings"><span><span className="dict-translation-label">English</span>{english ?? "Translation unavailable"}</span><span lang="am"><span className="dict-translation-label" lang="en">Amharic</span>{amharic ?? "Translation unavailable"}</span></span>
            <ChevronDown size={16} className="dict-chevron" aria-hidden="true" />
          </button>
          <div className="dict-row-tools"><button type="button" className="dict-icon-button" disabled={busy} aria-pressed={favorite} onClick={() => onToggleFavorite(word.id)} aria-label={(favorite ? "Remove " : "Add ") + word.text + (favorite ? " from favorites" : " to favorites")}><Heart size={18} fill={favorite ? "currentColor" : "none"} aria-hidden="true" /></button><button type="button" className="dict-icon-button" disabled={!word.audio?.available || !word.audio.url} onClick={() => onPlayAudio(word)} aria-label={"Play " + word.text + " pronunciation"} title={word.audio?.available && word.audio.url ? "Play pronunciation" : "Audio unavailable"}><Volume2 size={18} aria-hidden="true" /></button></div>
        </div>
        <div id={id} hidden={!expanded} className="dict-word-detail">
          {word.transliteration && <p className="dict-pronunciation">{word.transliteration}</p>}
          <dl className="dict-full-meanings"><div><dt>English</dt><dd>{english ?? "Translation unavailable"}</dd></div><div><dt>Amharic</dt><dd lang="am">{amharic ?? "Translation unavailable"}</dd></div></dl>
          {word.translations.filter((item) => item.context_note || !["en", "am"].includes(item.language_code)).map((item, i) => <p className="dict-context" key={item.language_code + i}><span>{item.language_code === "en" ? "Example" : item.language_code === "am" ? "አውድ" : item.language_code}</span><span lang={item.language_code}>{item.context_note ?? item.meaning}</span></p>)}
          <div className="dict-detail-actions"><div><button type="button" className="dict-secondary" disabled={busy || state === "learned"} onClick={() => onSetLearningState(word.id, "learned")}>{state === "learned" && <Check size={16} aria-hidden="true" />}{state === "learned" ? "Learned" : "Mark learned"}</button><button type="button" className="dict-secondary" disabled={busy || state === "needs_review"} onClick={() => onSetLearningState(word.id, "needs_review")}>{state === "needs_review" ? "Added to review" : "Needs review"}</button></div>{onPracticeWord && <button type="button" className="dict-practice" disabled={busy} onClick={() => onPracticeWord(word)}>{updatingWordId === word.id ? <LoaderCircle size={17} className="dict-spinner" aria-label="Saving word" /> : <ArrowRight size={17} aria-hidden="true" />}Practice this word</button>}</div>
        </div>
      </article>;
    })}</div> : <div className="dict-empty"><h3>{favoritesOnly ? "No favorites in these words" : "No words found"}</h3><p>{favoritesOnly ? (hasNextPage ? "Load more words to keep looking, or change your filters." : "Save a word with its heart to find it here.") : "Try another word, meaning or topic."}</p><button type="button" className="dict-secondary" onClick={onClearFilters}>Clear filters</button></div>}
    {hasNextPage && <div className="dict-load-more"><button type="button" className="dict-secondary" disabled={isLoadingMore} onClick={onLoadMore}>{isLoadingMore && <LoaderCircle size={17} className="dict-spinner" aria-hidden="true" />}Load more words<span className="sr-only" role="status">{isLoadingMore ? "Loading more words" : ""}</span></button></div>}
  </section>;
}
