import { useEffect, useRef, useState } from "react";
import { Volume2, AudioLines } from "lucide-react";
import type { FlashcardWord } from "./Flashcard";
import { questGuides, type QuestLanguageCode } from "./quest-guide";

export function ListeningPrompt({
  word, languageCode, onAudioUnavailable,
}: {
  word: FlashcardWord;
  languageCode: QuestLanguageCode;
  onAudioUnavailable: () => void;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const guide = questGuides[languageCode];

  useEffect(() => {
    const player = audio.current;
    return () => { player?.pause(); };
  }, [word.id]);

  async function play(rate: number) {
    if (!audio.current) return;
    setError(false);
    try {
      audio.current.pause();
      audio.current.currentTime = 0;
      audio.current.playbackRate = rate;
      await audio.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setError(true);
    }
  }

  return <section className="study-listening" aria-label="Listening challenge">
    <div className="study-listening-guide">
      <img src={guide.image} alt={`${guide.name}, your Quest guide`} width={120} height={144} />
      <span>{guide.name}</span>
    </div>
    <div className="study-listening-content">
      <p className="study-listening-eyebrow">A word from {guide.name}</p>
      <h2>What did you hear?</h2>
      <p>Listen, then choose its meaning.</p>
      <div className="study-listening-controls">
        <button type="button" className="study-listening-play" onClick={() => void play(1)} aria-label="Play word audio">
          <Volume2 size={22} aria-hidden="true" /> Play audio
        </button>
        <button type="button" className="study-listening-slow" onClick={() => void play(.8)} aria-label="Play word audio slowly">
          <AudioLines size={18} aria-hidden="true" /> Slower
        </button>
      </div>
      {playing && <span className="sr-only" role="status">Playing audio</span>}
      {error && <p className="study-listening-error" role="alert">Audio couldn’t play. You can try again or read the question instead.</p>}
      <button type="button" className="study-listening-fallback" onClick={onAudioUnavailable}>Can’t listen right now? Read the question</button>
    </div>
    <audio ref={audio} src={word.audioUrl ?? undefined} preload="none" onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setError(true); }} />
  </section>;
}
