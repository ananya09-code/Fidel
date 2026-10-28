
import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Heart,
  Search,
  Volume2,
  ArrowRight,
} from "lucide-react";

import type { DictionaryWord } from "@/lib/api/words";

type VocabularyListProps = {
  words: DictionaryWord[];
  favorites: string[];
  favoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  onToggleFavorite: (id: string) => void;
  onPlayAudio: (word: DictionaryWord) => void;
  onPracticeWord?: (word: DictionaryWord) => void;
  onClearFilters: () => void;
};

export function VocabularyList({
  words,
  favorites,
  favoritesOnly,
  onToggleFavoritesOnly,
  onToggleFavorite,
  onPlayAudio,
  onPracticeWord,
  onClearFilters,
}: VocabularyListProps) {
  const [expandedWord, setExpandedWord] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--sea-ink)]">
            {favoritesOnly ? "Your favorites" : "Explore vocabulary"}
          </h2>

          <p className="mt-1 text-sm text-[var(--sea-ink)]/55">
            {words.length} {words.length === 1 ? "word" : "words"} found
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleFavoritesOnly}
          aria-pressed={favoritesOnly}
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

      {words.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--sea-ink)]/10 bg-white/50">
          {words.map((word, index) => {
            const expanded = expandedWord === word.id;
            const favorite = favorites.includes(word.id);

            const englishMeaning =
              word.translations.find(
                (translation) => translation.language_code === "en",
              )?.meaning || word.meaning;

            return (
              <article
                key={word.id}
                className={
                  index < words.length - 1
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
                    aria-expanded={expanded}
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
                      onClick={() => onToggleFavorite(word.id)}
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
                      onClick={() => onPlayAudio(word)}
                      disabled={!word.audio?.available || !word.audio.url}
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
            onClick={onClearFilters}
            className="mt-4 rounded-xl border border-[var(--sea-ink)]/10 px-4 py-2 text-sm text-[var(--sea-ink)] transition hover:bg-[var(--sand)]/30"
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
