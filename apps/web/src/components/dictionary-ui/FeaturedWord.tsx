
import { Heart, Sparkles, Volume2 } from "lucide-react";
import type { DictionaryWord } from "@/lib/api/words";

type FeaturedWordProps = {
  word: DictionaryWord;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onPlayAudio: (word: DictionaryWord) => void;
};

export function FeaturedWord({
  word,
  isFavorite,
  onToggleFavorite,
  onPlayAudio,
}: FeaturedWordProps) {
  const englishMeaning =
    word.translations.find(
      (translation) => translation.language_code === "en",
    )?.meaning || word.meaning;

  return (
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
            {word.language_code}
          </p>

          <h2 className="mt-1 text-4xl font-semibold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
            {word.text}
          </h2>

          {word.transliteration && (
            <p className="mt-2 text-sm text-[var(--sea-ink)]/55">
              {word.transliteration}
            </p>
          )}

          <p className="mt-4 text-lg text-[var(--sea-ink)]">
            {englishMeaning}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleFavorite(word.id)}
            aria-label={
              isFavorite
                ? "Remove featured word from favorites"
                : "Add featured word to favorites"
            }
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--sea-ink)]/15 bg-white/40 text-[var(--sea-ink)] transition hover:bg-white/70"
          >
            <Heart
              size={20}
              fill={isFavorite ? "currentColor" : "none"}
            />
          </button>

          <button
            type="button"
            onClick={() => onPlayAudio(word)}
            disabled={!word.audio?.available || !word.audio.url}
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
          {word.category}
        </span>
        <span>{word.difficulty}</span>
      </div>
    </section>
  );
}
