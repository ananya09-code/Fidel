
import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
type WordOfTheDayProps = {
  word: string;
  pronunciation?: string;
  meaning: string;
  amharicMeaning?: string;
  audioSrc?: string;
  language?: string;
};

export function WordOfTheDay({
  word,
  pronunciation,
  meaning,
  amharicMeaning,
  audioSrc,
  language = "Afaan Oromoo",
}: WordOfTheDayProps) {
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [recalling, setRecalling] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resolvedAmharic = amharicMeaning ?? "Translation unavailable";

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  async function playAudio() {
    if (!audioSrc || playing) return;

    setAudioError(false);

    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    audio.onended = () => {
      setPlaying(false);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setPlaying(false);
      setAudioError(true);
      audioRef.current = null;
    };

    setPlaying(true);

    try {
      await audio.play();
    } catch {
      setPlaying(false);
      setAudioError(true);
      audioRef.current = null;
    }
  }

  return (
    <section>
      <div className="home-word-title"><h2>Word of the day</h2><span className="home-word-language">{language}</span></div>
      <div className="home-word-entry">
        <div><h3 className="home-word-text">{word}</h3>
        {pronunciation && <p className="home-word-pronunciation">{pronunciation}</p>}</div>
        <FidelTeacherMark className="home-word-teacher" />
      </div>
      <div className="home-recall-space" aria-live="polite">
      {recalling ? <p className="home-recall-question">What does <strong>{word}</strong> mean?<br /><span>Say it before you peek.</span></p> : <dl className="home-word-translations">
        <div><dt>English</dt><dd>{meaning}</dd></div>
        <div><dt>Amharic</dt><dd lang="am">{resolvedAmharic}</dd></div>
      </dl>}
      </div>
      <div className="home-word-actions">
      <button type="button" onClick={playAudio} disabled={!audioSrc || playing} className="home-listen" aria-label={`Listen to ${word} pronunciation`}>
        <Volume2 size={16} aria-hidden="true" />{playing ? "Playing…" : "Listen"}
      </button>
      <button type="button" className="home-recall-button" onClick={() => setRecalling(!recalling)} aria-pressed={recalling}>{recalling ? "Reveal meaning" : "Try to recall"}</button>
      </div>
      {audioError && <p role="alert" className="home-audio-notice">Audio couldn’t be played. Please try again.</p>}
      {!audioSrc && <p className="home-audio-notice">Audio unavailable</p>}
    </section>
  );
}
