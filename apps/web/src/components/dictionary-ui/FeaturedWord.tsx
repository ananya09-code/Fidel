import { useState } from "react";
import { Heart, Volume2 } from "lucide-react";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import { topicLabel } from "@/components/homepage-ui/labels";
import type { DictionaryWord } from "@/lib/api/words";

type FeaturedWordProps = {
  word: DictionaryWord;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onPlayAudio: (word: DictionaryWord) => void;
  isUpdating?: boolean;
};

export function FeaturedWord({ word, isFavorite, onToggleFavorite, onPlayAudio, isUpdating }: FeaturedWordProps) {
  const [hiddenWordId, setHiddenWordId] = useState<string | null>(null);
  const hidden = hiddenWordId === word.id;
  const english = word.translations.find((item) => item.language_code === "en")?.meaning ?? word.meaning;
  const amharic = word.translations.find((item) => item.language_code === "am")?.meaning;
  return <aside className="dict-feature" aria-labelledby="dict-feature-title">
    <div className="dict-feature-heading"><h2 id="dict-feature-title">A word to remember</h2><FidelTeacherMark className="dict-teacher" /></div>
    <p className="dict-feature-word">{word.text}</p>
    {word.transliteration && <p className="dict-pronunciation">{word.transliteration}</p>}
    <p className="dict-meta">{topicLabel(word.category)} · {topicLabel(word.difficulty)}</p>
    <div className="dict-recall-space" aria-live="polite">{hidden ? <p>What does it mean?<span>Say it before you peek.</span></p> : <dl><div><dt>English</dt><dd>{english ?? "Translation unavailable"}</dd></div><div><dt>Amharic</dt><dd lang="am">{amharic ?? "Translation unavailable"}</dd></div></dl>}</div>
    <button type="button" className="dict-recall" onClick={() => setHiddenWordId(hidden ? null : word.id)} aria-pressed={hidden}>{hidden ? "Reveal meaning" : "Try to recall"}</button>
    <div className="dict-feature-actions"><button type="button" className="dict-secondary" onClick={() => onPlayAudio(word)} disabled={!word.audio?.available || !word.audio.url}><Volume2 size={17} aria-hidden="true" />Listen</button><button type="button" className="dict-icon-button" onClick={() => onToggleFavorite(word.id)} disabled={isUpdating} aria-pressed={isFavorite} aria-label={isFavorite ? "Remove featured word from favorites" : "Add featured word to favorites"}><Heart size={19} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" /></button></div>
  </aside>;
}
